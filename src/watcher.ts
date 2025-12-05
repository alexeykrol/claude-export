/**
 * Watcher - Background daemon that monitors Claude Code sessions
 * for a specific project and exports dialogs to *dialog/ folder
 */

import * as chokidar from 'chokidar';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import {
  PROJECTS_DIR,
  findClaudeProjectDir,
  getProjectSessions,
  exportSession,
  isSessionExported,
  parseSession,
  SessionInfo,
  getProjectName,
  getSummary
} from './exporter';
import { getDialogFolder, ensureDialogFolder } from './gitignore';

// Debounce map to avoid multiple exports on rapid changes
const pendingExports = new Map<string, NodeJS.Timeout>();
const DEBOUNCE_MS = 2000; // Wait 2 seconds after last change

// Pending summary generation (longer debounce - wait for dialog to "close")
const pendingSummaries = new Map<string, NodeJS.Timeout>();
const SUMMARY_DEBOUNCE_MS = 30000; // Wait 30 seconds of inactivity before generating summary

// Track file sizes to detect actual content changes
const fileSizes = new Map<string, number>();

/**
 * Request summary generation for a dialog
 * Signals via stdout for Claude Code to pick up (when user is active)
 * Or spawns claude --print for non-interactive generation
 */
function requestSummary(dialogPath: string, verbose: boolean = false): void {
  const log = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('ru-RU');
    console.log(`[${timestamp}] ${msg}`);
  };

  // Check if already has summary
  const existingSummary = getSummary(dialogPath);
  if (existingSummary) {
    if (verbose) {
      log(`Summary already exists for ${path.basename(dialogPath)}`);
    }
    return;
  }

  log(`Requesting summary for: ${path.basename(dialogPath)}`);

  // Use claude -p (print mode) for non-interactive generation
  const prompt = `Прочитай файл ${dialogPath} и создай краткое саммари диалога (1-2 предложения на русском). Затем используй Edit чтобы добавить саммари в начало файла в формате: <!-- SUMMARY: твоё саммари -->`;

  const claude = spawn('claude', [
    '-p',
    '--dangerously-skip-permissions',
    '--tools', 'Read,Edit',
    prompt
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    cwd: path.dirname(dialogPath)
  });

  let output = '';
  let errorOutput = '';

  claude.stdout?.on('data', (data) => {
    output += data.toString();
  });

  claude.stderr?.on('data', (data) => {
    errorOutput += data.toString();
  });

  claude.on('error', (err) => {
    console.error(`Failed to spawn claude: ${err.message}`);
  });

  claude.on('close', (code) => {
    if (code === 0) {
      log(`Summary completed for: ${path.basename(dialogPath)}`);
      if (verbose) {
        log(`Claude output: ${output.substring(0, 200)}...`);
      }
    } else {
      console.error(`Summary generation failed (code ${code})`);
      if (errorOutput) {
        console.error(`Error: ${errorOutput.substring(0, 200)}`);
      }
    }
  });
}

export interface WatcherOptions {
  verbose?: boolean;
  debounceMs?: number;
}

export class SessionWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private options: WatcherOptions;
  private isRunning = false;
  private targetProjectPath: string;
  private claudeProjectDir: string | null = null;

  constructor(targetProjectPath: string, options: WatcherOptions = {}) {
    this.targetProjectPath = path.resolve(targetProjectPath);
    this.options = {
      verbose: false,
      debounceMs: DEBOUNCE_MS,
      ...options
    };
  }

  private log(message: string): void {
    const timestamp = new Date().toLocaleTimeString('ru-RU');
    console.log(`[${timestamp}] ${message}`);
  }

  private debug(message: string): void {
    if (this.options.verbose) {
      this.log(`DEBUG: ${message}`);
    }
  }

  private scheduleSummary(dialogPath: string): void {
    const filename = path.basename(dialogPath);

    // Cancel existing scheduled summary
    const existing = pendingSummaries.get(filename);
    if (existing) {
      clearTimeout(existing);
    }

    // Schedule summary generation after period of inactivity
    const timeout = setTimeout(() => {
      pendingSummaries.delete(filename);
      requestSummary(dialogPath, this.options.verbose);
    }, SUMMARY_DEBOUNCE_MS);

    pendingSummaries.set(filename, timeout);
    this.debug(`Scheduled summary for ${filename} in ${SUMMARY_DEBOUNCE_MS / 1000}s`);
  }

  private scheduleExport(filePath: string): void {
    const sessionId = path.basename(filePath, '.jsonl');

    // Clear existing timeout
    const existing = pendingExports.get(sessionId);
    if (existing) {
      clearTimeout(existing);
    }

    // Schedule new export
    const timeout = setTimeout(() => {
      pendingExports.delete(sessionId);
      this.exportFile(filePath);
    }, this.options.debounceMs);

    pendingExports.set(sessionId, timeout);
    this.debug(`Scheduled export for ${sessionId} in ${this.options.debounceMs}ms`);
  }

  private exportFile(filePath: string): void {
    try {
      const stat = fs.statSync(filePath);
      const previousSize = fileSizes.get(filePath);

      // Skip if file size hasn't changed (avoid duplicate exports)
      if (previousSize === stat.size) {
        this.debug(`Skipping ${path.basename(filePath)} - no size change`);
        return;
      }

      fileSizes.set(filePath, stat.size);

      // Parse session info
      const projectDir = path.basename(path.dirname(filePath));
      const filename = path.basename(filePath);
      const sessionId = filename.replace('.jsonl', '');

      const messages = parseSession(filePath);
      const dialogMessages = messages.filter(m => m.type === 'user' || m.type === 'assistant');

      if (dialogMessages.length === 0) {
        this.debug(`Skipping ${sessionId} - no dialog messages`);
        return;
      }

      const summaries = messages
        .filter(m => m.type === 'summary')
        .map(m => (m as any).summary || '')
        .filter((s: string) => s.length > 0);

      const firstTimestamp = dialogMessages[0].timestamp;

      const session: SessionInfo = {
        id: sessionId,
        filename,
        projectName: getProjectName(projectDir),
        projectPath: projectDir,
        date: new Date(firstTimestamp).toLocaleDateString('ru-RU'),
        dateISO: new Date(firstTimestamp).toISOString().split('T')[0],
        size: `${(stat.size / 1024).toFixed(0)}KB`,
        sizeBytes: stat.size,
        summaries: summaries.slice(0, 5),
        messageCount: dialogMessages.length,
        lastModified: stat.mtime
      };

      // Export to target project's *dialog/ folder
      const result = exportSession(session, this.targetProjectPath);

      this.log(`Exported: ${path.basename(result.markdownPath)} (${session.messageCount} messages)`);

      // Schedule summary generation (will run after inactivity period)
      this.scheduleSummary(result.markdownPath);

    } catch (err) {
      console.error(`Error exporting ${filePath}:`, err);
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Watcher is already running');
      return;
    }

    // Check if target project exists
    if (!fs.existsSync(this.targetProjectPath)) {
      console.error(`Target project not found: ${this.targetProjectPath}`);
      process.exit(1);
    }

    // Find Claude project directory
    this.claudeProjectDir = findClaudeProjectDir(this.targetProjectPath);

    if (!this.claudeProjectDir) {
      console.error(`No Claude sessions found for project: ${this.targetProjectPath}`);
      console.error('Make sure Claude Code has been used in this project.');
      process.exit(1);
    }

    const claudeProjectPath = path.join(PROJECTS_DIR, this.claudeProjectDir);
    const dialogFolder = ensureDialogFolder(this.targetProjectPath);

    this.log('Starting Claude Export Watcher...');
    this.log(`Project: ${this.targetProjectPath}`);
    this.log(`Claude sessions: ${claudeProjectPath}`);
    this.log(`Dialogs folder: ${dialogFolder}`);
    this.log('');

    // Initial export of all sessions
    this.log('Performing initial export...');
    const sessions = getProjectSessions(this.targetProjectPath);

    let newCount = 0;
    for (const session of sessions) {
      if (!isSessionExported(session.id, this.targetProjectPath)) {
        const sourcePath = path.join(PROJECTS_DIR, session.projectPath, session.filename);
        fileSizes.set(sourcePath, session.sizeBytes);
        this.exportFile(sourcePath);
        newCount++;
      } else {
        // Track existing file sizes
        const sourcePath = path.join(PROJECTS_DIR, session.projectPath, session.filename);
        fileSizes.set(sourcePath, session.sizeBytes);
      }
    }

    if (newCount === 0) {
      this.log('All sessions already exported');
    }
    this.log('');

    // Start watching Claude project directory
    this.watcher = chokidar.watch(claudeProjectPath, {
      ignored: [
        /(^|[\/\\])\../,           // Ignore dotfiles
        /agent-.*\.jsonl$/,        // Ignore agent files
        /.*(?<!\.jsonl)$/          // Only watch .jsonl files
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
      }
    });

    this.watcher
      .on('add', (filePath) => {
        if (filePath.endsWith('.jsonl') && !path.basename(filePath).startsWith('agent-')) {
          this.debug(`New file: ${filePath}`);
          this.scheduleExport(filePath);
        }
      })
      .on('change', (filePath) => {
        if (filePath.endsWith('.jsonl') && !path.basename(filePath).startsWith('agent-')) {
          this.debug(`Changed: ${filePath}`);
          this.scheduleExport(filePath);
        }
      })
      .on('error', (error) => {
        console.error('Watcher error:', error);
      });

    this.isRunning = true;
    this.log('Watcher started. Press Ctrl+C to stop.');
    this.log('New and updated sessions will be automatically exported to *dialog/');
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    // Clear pending exports
    for (const timeout of pendingExports.values()) {
      clearTimeout(timeout);
    }
    pendingExports.clear();

    // Clear pending summaries
    for (const timeout of pendingSummaries.values()) {
      clearTimeout(timeout);
    }
    pendingSummaries.clear();

    this.isRunning = false;
    this.log('Watcher stopped');
  }
}

// Run as standalone
export async function startWatcher(
  targetProjectPath: string,
  options: WatcherOptions = {}
): Promise<SessionWatcher> {
  const watcher = new SessionWatcher(targetProjectPath, options);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n');
    await watcher.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await watcher.stop();
    process.exit(0);
  });

  await watcher.start();
  return watcher;
}
