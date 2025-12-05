/**
 * Server - Express server for Claude Export UI
 * Provides API for managing dialogs and their Git visibility
 */

import express, { Application, Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import {
  PROJECTS_DIR,
  getProjectSessions,
  getExportedDialogs,
  exportSession,
  isSessionExported,
  getExportedPath,
  parseSession,
  extractContent,
  formatTimestamp,
  toMarkdown,
  SessionInfo,
  getExportedDialogsWithSummaries,
  createSummaryTask,
  getPendingTasks,
  getSummary
} from './exporter';
import {
  getDialogFolder,
  toggleVisibility,
  setVisibility,
  isPublic
} from './gitignore';

let currentProjectPath: string = process.cwd();

const app: Application = express();

app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API: Get current project info
app.get('/api/project', (req: Request, res: Response) => {
  try {
    const dialogFolder = getDialogFolder(currentProjectPath);
    const dialogs = getExportedDialogs(currentProjectPath);
    const sessions = getProjectSessions(currentProjectPath);

    res.json({
      path: currentProjectPath,
      name: path.basename(currentProjectPath),
      dialogFolder,
      dialogCount: dialogs.length,
      sessionCount: sessions.length
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// API: Set current project path
app.post('/api/project', (req: Request, res: Response) => {
  try {
    const { path: newPath } = req.body;

    if (!newPath) {
      return res.status(400).json({ error: 'Path is required' });
    }

    const resolvedPath = path.resolve(newPath);

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'Path does not exist' });
    }

    if (!fs.statSync(resolvedPath).isDirectory()) {
      return res.status(400).json({ error: 'Path must be a directory' });
    }

    currentProjectPath = resolvedPath;

    const dialogFolder = getDialogFolder(currentProjectPath);
    const dialogs = getExportedDialogs(currentProjectPath);
    const sessions = getProjectSessions(currentProjectPath);

    res.json({
      success: true,
      path: currentProjectPath,
      name: path.basename(currentProjectPath),
      dialogFolder,
      dialogCount: dialogs.length,
      sessionCount: sessions.length
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// API: Get all sessions for current project
app.get('/api/sessions', (req: Request, res: Response) => {
  try {
    const sessions = getProjectSessions(currentProjectPath);

    // Add export status to each session
    const sessionsWithStatus = sessions.map(s => ({
      ...s,
      isExported: isSessionExported(s.id, currentProjectPath),
      exportPath: getExportedPath(s.id, currentProjectPath)
    }));

    res.json({
      sessions: sessionsWithStatus,
      total: sessions.length,
      exported: sessionsWithStatus.filter(s => s.isExported).length,
      projectPath: currentProjectPath
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// API: Get exported dialogs with visibility status and summaries
app.get('/api/dialogs', (req: Request, res: Response) => {
  try {
    const dialogs = getExportedDialogsWithSummaries(currentProjectPath);
    const pending = getPendingTasks(currentProjectPath);

    res.json({
      dialogs,
      total: dialogs.length,
      public: dialogs.filter(d => d.isPublic).length,
      private: dialogs.filter(d => !d.isPublic).length,
      withSummary: dialogs.filter(d => d.summary).length,
      pendingTasks: pending.length,
      projectPath: currentProjectPath
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// API: Request summary generation for a dialog
app.post('/api/summary/request/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const dialogFolder = getDialogFolder(currentProjectPath);
    const filePath = path.join(dialogFolder, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dialog not found' });
    }

    // Check if already has summary
    const existingSummary = getSummary(filePath);
    if (existingSummary) {
      return res.json({
        success: true,
        alreadyExists: true,
        summary: existingSummary
      });
    }

    // Create task
    const taskId = createSummaryTask(filename, currentProjectPath);

    // Signal to Claude Code via stdout (monitored by BashOutput)
    const dialogPath = path.join(getDialogFolder(currentProjectPath), filename);
    console.log(`[CLAUDE_TASK] Generate summary for: ${dialogPath}`);

    res.json({
      success: true,
      taskId,
      message: 'Summary task created.'
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// API: Get pending tasks
app.get('/api/tasks/pending', (req: Request, res: Response) => {
  try {
    const tasks = getPendingTasks(currentProjectPath);
    res.json({ tasks, count: tasks.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// API: Get session content
app.get('/api/session/:projectPath/:id', (req: Request, res: Response) => {
  try {
    const { projectPath, id } = req.params;
    const filePath = path.join(PROJECTS_DIR, projectPath, `${id}.jsonl`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = parseSession(filePath);

    const summaries = messages
      .filter(m => m.type === 'summary')
      .map(m => (m as any).summary || '');

    const dialog = messages
      .filter(m => m.type === 'user' || m.type === 'assistant')
      .map(m => ({
        role: m.type,
        content: extractContent(m),
        timestamp: m.timestamp,
        time: formatTimestamp(m.timestamp)
      }))
      .filter(m => m.content.trim().length > 0);

    res.json({
      id,
      projectPath,
      summaries,
      dialog,
      messageCount: dialog.length
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// API: Export session to .dialog/
app.post('/api/export/:projectPath/:id', (req: Request, res: Response) => {
  try {
    const { projectPath, id } = req.params;

    const sessions = getProjectSessions(currentProjectPath);
    const session = sessions.find(s => s.projectPath === projectPath && s.id === id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const result = exportSession(session, currentProjectPath);

    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// API: Toggle dialog visibility in Git
app.post('/api/dialog/toggle/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const dialogFolder = getDialogFolder(currentProjectPath);
    const filePath = path.join(dialogFolder, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dialog not found' });
    }

    const newIsPublic = toggleVisibility(filePath, currentProjectPath);

    res.json({
      success: true,
      filename,
      isPublic: newIsPublic
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// API: Set dialog visibility explicitly
app.post('/api/dialog/visibility/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const { isPublic: makePublic } = req.body;

    const dialogFolder = getDialogFolder(currentProjectPath);
    const filePath = path.join(dialogFolder, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dialog not found' });
    }

    setVisibility(filePath, currentProjectPath, makePublic);

    res.json({
      success: true,
      filename,
      isPublic: makePublic
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// API: Get dialog markdown content
app.get('/api/dialog/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const dialogFolder = getDialogFolder(currentProjectPath);
    const filePath = path.join(dialogFolder, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Dialog not found' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const fileIsPublic = isPublic(filePath, currentProjectPath);

    res.json({
      filename,
      content,
      path: filePath,
      isPublic: fileIsPublic
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// API: Download markdown file
app.get('/api/download/:projectPath/:id', (req: Request, res: Response) => {
  try {
    const { projectPath, id } = req.params;

    const sessions = getProjectSessions(currentProjectPath);
    const session = sessions.find(s => s.projectPath === projectPath && s.id === id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const filePath = path.join(PROJECTS_DIR, projectPath, `${id}.jsonl`);
    const messages = parseSession(filePath);
    const markdown = toMarkdown(messages, session);

    const filename = `${session.dateISO}_session-${id.substring(0, 8)}.md`;

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(markdown);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// API: Search sessions
app.get('/api/search', (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || '').toLowerCase();

    if (!query) {
      return res.json({ results: [] });
    }

    const sessions = getProjectSessions(currentProjectPath);

    const results = sessions.filter(s => {
      // Search in summaries
      if (s.summaries.some(sum => sum.toLowerCase().includes(query))) {
        return true;
      }
      // Search in project name
      if (s.projectName.toLowerCase().includes(query)) {
        return true;
      }
      return false;
    });

    res.json({ results, query });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Serve index.html for all other routes
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

export function startServer(port: number = 3333, projectPath?: string): void {
  if (projectPath) {
    currentProjectPath = path.resolve(projectPath);
  }

  const dialogFolder = getDialogFolder(currentProjectPath);

  app.listen(port, () => {
    console.log('');
    console.log('═'.repeat(60));
    console.log('  Claude Export UI');
    console.log('═'.repeat(60));
    console.log(`  URL:      http://localhost:${port}`);
    console.log(`  Project:  ${currentProjectPath}`);
    console.log(`  Dialogs:  ${dialogFolder}`);
    console.log('═'.repeat(60));
    console.log('');
    console.log('Press Ctrl+C to stop');

    // Check for dialogs without summaries and signal Claude
    const dialogs = getExportedDialogsWithSummaries(currentProjectPath);
    const withoutSummary = dialogs.filter(d => !d.summary);

    if (withoutSummary.length > 0) {
      console.log('');
      console.log(`Found ${withoutSummary.length} dialog(s) without summary:`);
      withoutSummary.forEach(d => {
        console.log(`[CLAUDE_TASK] Generate summary for: ${d.filePath}`);
      });
    }
  });
}

export default app;
