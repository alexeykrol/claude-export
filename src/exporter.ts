/**
 * Exporter - Convert Claude Code JSONL sessions to Markdown
 * Saves dialogs to *dialog/ folder inside the target project
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import {
  ensureDialogFolder,
  getDialogFolder,
  addToGitignore,
  isPublic,
  getDialogFiles
} from './gitignore';

/**
 * Get git user info for author attribution
 */
export function getGitAuthor(): { name: string; email: string } {
  try {
    const name = execSync('git config user.name', { encoding: 'utf-8' }).trim();
    const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
    return { name: name || 'Unknown', email: email || '' };
  } catch {
    return { name: os.userInfo().username || 'Unknown', email: '' };
  }
}

// Types
export interface Message {
  type: 'user' | 'assistant' | 'summary' | 'file-history-snapshot';
  message?: {
    content?: string | Array<{ type: string; text?: string }>;
  };
  timestamp: number;
  uuid: string;
  parentUuid?: string;
  summary?: string;
}

export interface SessionInfo {
  id: string;
  filename: string;
  projectName: string;
  projectPath: string;
  date: string;
  dateISO: string;
  size: string;
  sizeBytes: number;
  summaries: string[];
  messageCount: number;
  lastModified: Date;
}

export interface ExportedSession {
  id: string;
  projectName: string;
  date: string;
  summaries: string[];
  messageCount: number;
  markdownPath: string;
  exportedAt: string;
  isPublic: boolean;
}

export interface DialogInfo {
  filename: string;
  filePath: string;
  date: string;
  sessionId: string;
  isPublic: boolean;
  size: string;
  sizeBytes: number;
  lastModified: Date;
}

// Paths
export const CLAUDE_DIR = path.join(os.homedir(), '.claude');
export const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');

// Helpers
export function getProjectName(projectPath: string): string {
  // Convert "-Users-alex-Code-MyProject" to "MyProject"
  const parts = projectPath.split('-').filter(p => p.length > 0);
  return parts[parts.length - 1] || projectPath;
}

export function getProjectFullPath(projectPath: string): string {
  // Convert "-Users-alex-Code-MyProject" to "/Users/alex/Code/MyProject"
  return projectPath.replace(/^-/, '/').replace(/-/g, '/');
}

export function parseSession(filePath: string): Message[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  return lines
    .map(line => {
      try {
        return JSON.parse(line) as Message;
      } catch {
        return null;
      }
    })
    .filter((msg): msg is Message => msg !== null);
}

export function extractContent(msg: Message): string {
  if (!msg.message?.content) return '';

  const content = msg.message.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .filter(block => block.type === 'text' && block.text)
      .map(block => block.text)
      .join('\n');
  }

  return '';
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function formatDateISO(ts: number): string {
  return new Date(ts).toISOString().split('T')[0];
}

/**
 * Find Claude project directory for a given real project path
 * Converts /Users/alex/Code/MyProject to -Users-alex-Code-MyProject
 */
export function findClaudeProjectDir(realProjectPath: string): string | null {
  const normalized = realProjectPath.replace(/\//g, '-');

  if (fs.existsSync(path.join(PROJECTS_DIR, normalized))) {
    return normalized;
  }

  // Try without leading dash
  const withoutLeading = normalized.replace(/^-/, '');
  if (fs.existsSync(path.join(PROJECTS_DIR, '-' + withoutLeading))) {
    return '-' + withoutLeading;
  }

  // Search for matching directory
  if (!fs.existsSync(PROJECTS_DIR)) {
    return null;
  }

  const dirs = fs.readdirSync(PROJECTS_DIR);
  const match = dirs.find(d => {
    const fullPath = getProjectFullPath(d);
    return fullPath === realProjectPath || fullPath === path.resolve(realProjectPath);
  });

  return match || null;
}

/**
 * Get all sessions from Claude for a specific project
 */
export function getProjectSessions(realProjectPath: string): SessionInfo[] {
  const claudeProjectDir = findClaudeProjectDir(realProjectPath);

  if (!claudeProjectDir) {
    return [];
  }

  const projectPath = path.join(PROJECTS_DIR, claudeProjectDir);
  const files = fs.readdirSync(projectPath)
    .filter(f => f.endsWith('.jsonl') && !f.startsWith('agent-'));

  const sessions: SessionInfo[] = [];

  for (const filename of files) {
    const filePath = path.join(projectPath, filename);
    const stat = fs.statSync(filePath);

    try {
      const messages = parseSession(filePath);

      const summaries = messages
        .filter(m => m.type === 'summary')
        .map(m => m.summary || '')
        .filter(s => s.length > 0);

      const dialogMessages = messages.filter(m => m.type === 'user' || m.type === 'assistant');

      const firstTimestamp = dialogMessages.length > 0
        ? dialogMessages[0].timestamp
        : stat.mtime.getTime();

      sessions.push({
        id: filename.replace('.jsonl', ''),
        filename,
        projectName: getProjectName(claudeProjectDir),
        projectPath: claudeProjectDir,
        date: formatDate(firstTimestamp),
        dateISO: formatDateISO(firstTimestamp),
        size: `${(stat.size / 1024).toFixed(0)}KB`,
        sizeBytes: stat.size,
        summaries: summaries.slice(0, 5),
        messageCount: dialogMessages.length,
        lastModified: stat.mtime
      });
    } catch (err) {
      console.error(`Error parsing ${filePath}:`, err);
    }
  }

  // Sort by date descending
  sessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

  return sessions;
}

/**
 * Get all sessions from all projects (legacy, for compatibility)
 */
export function getAllSessions(): SessionInfo[] {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }

  const projectDirs = fs.readdirSync(PROJECTS_DIR)
    .filter(d => {
      const fullPath = path.join(PROJECTS_DIR, d);
      return fs.statSync(fullPath).isDirectory();
    });

  const sessions: SessionInfo[] = [];

  for (const projectDir of projectDirs) {
    const projectPath = path.join(PROJECTS_DIR, projectDir);
    const files = fs.readdirSync(projectPath)
      .filter(f => f.endsWith('.jsonl') && !f.startsWith('agent-'));

    for (const filename of files) {
      const filePath = path.join(projectPath, filename);
      const stat = fs.statSync(filePath);

      try {
        const messages = parseSession(filePath);

        const summaries = messages
          .filter(m => m.type === 'summary')
          .map(m => m.summary || '')
          .filter(s => s.length > 0);

        const dialogMessages = messages.filter(m => m.type === 'user' || m.type === 'assistant');

        const firstTimestamp = dialogMessages.length > 0
          ? dialogMessages[0].timestamp
          : stat.mtime.getTime();

        sessions.push({
          id: filename.replace('.jsonl', ''),
          filename,
          projectName: getProjectName(projectDir),
          projectPath: projectDir,
          date: formatDate(firstTimestamp),
          dateISO: formatDateISO(firstTimestamp),
          size: `${(stat.size / 1024).toFixed(0)}KB`,
          sizeBytes: stat.size,
          summaries: summaries.slice(0, 5),
          messageCount: dialogMessages.length,
          lastModified: stat.mtime
        });
      } catch (err) {
        // Skip corrupted files
        console.error(`Error parsing ${filePath}:`, err);
      }
    }
  }

  // Sort by date descending
  sessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

  return sessions;
}

// Convert session to Markdown
export function toMarkdown(messages: Message[], session: SessionInfo): string {
  const dialogMessages = messages.filter(m => m.type === 'user' || m.type === 'assistant');
  const summaries = messages.filter(m => m.type === 'summary');
  const author = getGitAuthor();

  const lines: string[] = [];

  // Author comment for parsing
  lines.push(`<!-- AUTHOR: ${author.name}${author.email ? ` <${author.email}>` : ''} -->`);

  lines.push('');
  lines.push('# Claude Code Session');
  lines.push('');
  lines.push(`**Author:** ${author.name}`);
  lines.push(`**Project:** ${session.projectName}`);
  lines.push(`**Path:** \`${getProjectFullPath(session.projectPath)}\``);
  lines.push(`**Session ID:** \`${session.id}\``);
  lines.push(`**Date:** ${session.date}`);
  lines.push(`**Messages:** ${dialogMessages.length}`);
  lines.push(`**Exported:** ${new Date().toLocaleString('ru-RU')}`);
  lines.push('');

  if (summaries.length > 0) {
    lines.push('## Summaries');
    lines.push('');
    summaries.forEach(s => {
      lines.push(`- ${s.summary || ''}`);
    });
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## Dialog');
  lines.push('');

  for (const msg of dialogMessages) {
    const role = msg.type === 'user' ? '👤 **User**' : '🤖 **Claude**';
    const time = formatTimestamp(msg.timestamp);
    const content = extractContent(msg);

    if (!content.trim()) continue;

    lines.push(`### ${role} *(${time})*`);
    lines.push('');
    lines.push(content);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  lines.push('');
  lines.push('*Exported with claude-export*');

  return lines.join('\n');
}

/**
 * Export session to markdown file in target project's *dialog/ folder
 * @param session - Session info
 * @param targetProjectPath - Real path to target project (where *dialog/ will be created)
 * @returns ExportedSession info
 */
export function exportSession(session: SessionInfo, targetProjectPath: string): ExportedSession {
  const sourcePath = path.join(PROJECTS_DIR, session.projectPath, session.filename);
  const messages = parseSession(sourcePath);
  const markdown = toMarkdown(messages, session);

  // Ensure *dialog folder exists
  const dialogFolder = ensureDialogFolder(targetProjectPath);

  // Create filename: 2025-12-05_session-abc12345.md
  const shortId = session.id.substring(0, 8);
  const filename = `${session.dateISO}_session-${shortId}.md`;
  const outputPath = path.join(dialogFolder, filename);

  // Write markdown file
  fs.writeFileSync(outputPath, markdown);

  // Add to .gitignore by default (private)
  addToGitignore(outputPath, targetProjectPath);

  return {
    id: session.id,
    projectName: session.projectName,
    date: session.date,
    summaries: session.summaries,
    messageCount: session.messageCount,
    markdownPath: outputPath,
    exportedAt: new Date().toISOString(),
    isPublic: false // Private by default
  };
}

/**
 * Get list of exported dialogs in project's *dialog/ folder
 */
export function getExportedDialogs(targetProjectPath: string): DialogInfo[] {
  const dialogFiles = getDialogFiles(targetProjectPath);

  return dialogFiles.map(filePath => {
    const stat = fs.statSync(filePath);
    const filename = path.basename(filePath);

    // Parse filename: 2025-12-05_session-abc12345.md
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})_session-([a-f0-9]+)\.md$/);
    const date = match ? match[1] : 'Unknown';
    const sessionId = match ? match[2] : filename;

    return {
      filename,
      filePath,
      date,
      sessionId,
      isPublic: isPublic(filePath, targetProjectPath),
      size: `${(stat.size / 1024).toFixed(0)}KB`,
      sizeBytes: stat.size,
      lastModified: stat.mtime
    };
  });
}

/**
 * Check if session is already exported in target project
 */
export function isSessionExported(sessionId: string, targetProjectPath: string): boolean {
  const shortId = sessionId.substring(0, 8);
  const dialogFolder = getDialogFolder(targetProjectPath);

  if (!fs.existsSync(dialogFolder)) {
    return false;
  }

  const files = fs.readdirSync(dialogFolder);
  return files.some(f => f.includes(`session-${shortId}`));
}

/**
 * Get the markdown path if session is exported
 */
export function getExportedPath(sessionId: string, targetProjectPath: string): string | null {
  const shortId = sessionId.substring(0, 8);
  const dialogFolder = getDialogFolder(targetProjectPath);

  if (!fs.existsSync(dialogFolder)) {
    return null;
  }

  const files = fs.readdirSync(dialogFolder);
  const match = files.find(f => f.includes(`session-${shortId}`));

  return match ? path.join(dialogFolder, match) : null;
}

/**
 * Export all new sessions for a project
 */
export function exportNewSessions(targetProjectPath: string): ExportedSession[] {
  const sessions = getProjectSessions(targetProjectPath);
  const newExports: ExportedSession[] = [];

  for (const session of sessions) {
    if (!isSessionExported(session.id, targetProjectPath)) {
      try {
        const result = exportSession(session, targetProjectPath);
        newExports.push(result);
        console.log(`Exported: ${path.basename(result.markdownPath)}`);
      } catch (err) {
        console.error(`Failed to export ${session.id}:`, err);
      }
    }
  }

  return newExports;
}

// Summary management

const SUMMARY_PATTERN = /^<!-- SUMMARY: (.*?) -->$/m;
const PENDING_FOLDER = '.pending';

/**
 * Extract summary from dialog file content
 */
export function extractSummary(content: string): string | null {
  const match = content.match(SUMMARY_PATTERN);
  return match ? match[1] : null;
}

/**
 * Check if dialog file has a summary
 */
export function hasSummary(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  return SUMMARY_PATTERN.test(content);
}

/**
 * Get summary from dialog file
 */
export function getSummary(filePath: string): string | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  return extractSummary(content);
}

/**
 * Add or update summary in dialog file
 */
export function setSummary(filePath: string, summary: string): void {
  let content = fs.readFileSync(filePath, 'utf-8');

  if (SUMMARY_PATTERN.test(content)) {
    // Update existing summary
    content = content.replace(SUMMARY_PATTERN, `<!-- SUMMARY: ${summary} -->`);
  } else {
    // Add summary at the beginning
    content = `<!-- SUMMARY: ${summary} -->\n\n${content}`;
  }

  fs.writeFileSync(filePath, content);
}

/**
 * Get pending folder path
 */
export function getPendingFolder(projectPath: string): string {
  return path.join(getDialogFolder(projectPath), PENDING_FOLDER);
}

/**
 * Ensure pending folder exists
 */
export function ensurePendingFolder(projectPath: string): string {
  const pendingPath = getPendingFolder(projectPath);
  if (!fs.existsSync(pendingPath)) {
    fs.mkdirSync(pendingPath, { recursive: true });
  }
  return pendingPath;
}

/**
 * Create a summary request task
 */
export function createSummaryTask(filename: string, projectPath: string): string {
  const pendingFolder = ensurePendingFolder(projectPath);
  const taskId = `summary-${Date.now()}`;
  const taskPath = path.join(pendingFolder, `${taskId}.json`);

  const task = {
    id: taskId,
    type: 'summary',
    filename,
    dialogPath: path.join(getDialogFolder(projectPath), filename),
    createdAt: new Date().toISOString(),
    status: 'pending'
  };

  fs.writeFileSync(taskPath, JSON.stringify(task, null, 2));
  return taskId;
}

/**
 * Get all pending tasks
 */
export function getPendingTasks(projectPath: string): Array<{
  id: string;
  type: string;
  filename: string;
  dialogPath: string;
  createdAt: string;
  status: string;
}> {
  const pendingFolder = getPendingFolder(projectPath);

  if (!fs.existsSync(pendingFolder)) {
    return [];
  }

  const files = fs.readdirSync(pendingFolder).filter(f => f.endsWith('.json'));

  return files.map(f => {
    const content = fs.readFileSync(path.join(pendingFolder, f), 'utf-8');
    return JSON.parse(content);
  });
}

/**
 * Complete a task (delete it)
 */
export function completeTask(taskId: string, projectPath: string): void {
  const pendingFolder = getPendingFolder(projectPath);
  const taskPath = path.join(pendingFolder, `${taskId}.json`);

  if (fs.existsSync(taskPath)) {
    fs.unlinkSync(taskPath);
  }
}

/**
 * Get dialog info with summary
 */
export function getDialogWithSummary(filePath: string, projectPath: string): DialogInfo & { summary: string | null } {
  const stat = fs.statSync(filePath);
  const filename = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');

  const match = filename.match(/^(\d{4}-\d{2}-\d{2})_session-([a-f0-9]+)\.md$/);
  const date = match ? match[1] : 'Unknown';
  const sessionId = match ? match[2] : filename;

  return {
    filename,
    filePath,
    date,
    sessionId,
    isPublic: isPublic(filePath, projectPath),
    size: `${(stat.size / 1024).toFixed(0)}KB`,
    sizeBytes: stat.size,
    lastModified: stat.mtime,
    summary: extractSummary(content)
  };
}

/**
 * Get all dialogs with summaries
 */
export function getExportedDialogsWithSummaries(targetProjectPath: string): Array<DialogInfo & { summary: string | null }> {
  const dialogFiles = getDialogFiles(targetProjectPath);

  return dialogFiles.map(filePath => getDialogWithSummary(filePath, targetProjectPath));
}
