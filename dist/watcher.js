"use strict";
/**
 * Watcher - Background daemon that monitors Claude Code sessions
 * for a specific project and exports dialogs to .dialog/ folder
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionWatcher = void 0;
exports.startWatcher = startWatcher;
const chokidar = __importStar(require("chokidar"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const exporter_1 = require("./exporter");
const gitignore_1 = require("./gitignore");
// Debounce map to avoid multiple exports on rapid changes
const pendingExports = new Map();
const DEBOUNCE_MS = 2000; // Wait 2 seconds after last change
// Pending summary generation (longer debounce - wait for dialog to "close")
const pendingSummaries = new Map();
const SUMMARY_DEBOUNCE_MS = 30000; // Wait 30 seconds of inactivity before generating summary
// Track active session per project to detect session closure
const activeSessionPerProject = new Map(); // projectDir -> sessionId
// Track file sizes to detect actual content changes
const fileSizes = new Map();
/**
 * Request summary generation for a dialog
 * @param dialogPath - path to the markdown file
 * @param verbose - enable verbose logging
 * @param isFinal - true if this is a final summary for a closed dialog
 */
function requestSummary(dialogPath, verbose = false, isFinal = false) {
    const log = (msg) => {
        const timestamp = new Date().toLocaleTimeString('ru-RU');
        console.log(`[${timestamp}] ${msg}`);
    };
    // For non-final summaries, skip if already has summary
    const existingSummary = (0, exporter_1.getSummary)(dialogPath);
    if (existingSummary && !isFinal) {
        if (verbose) {
            log(`Summary already exists for ${path.basename(dialogPath)}`);
        }
        return;
    }
    const summaryType = isFinal ? 'FINAL summary' : 'summary';
    log(`Requesting ${summaryType} for: ${path.basename(dialogPath)}`);
    // Different prompts for interim vs final summary
    const prompt = isFinal
        ? `Прочитай файл ${dialogPath} — это завершённый диалог с Claude Code.

Создай ФИНАЛЬНОЕ детальное саммари на русском языке:
1. Главная цель/задача диалога (1 предложение)
2. Что было сделано (2-3 ключевых результата)
3. Итоговый статус: завершено/частично/отложено

Формат (3-5 предложений, информативно и полезно для быстрого понимания сути).

Затем используй Edit чтобы ЗАМЕНИТЬ существующее саммари в начале файла в формате:
<!-- SUMMARY: твоё детальное саммари -->`
        : `Прочитай файл ${dialogPath} и создай краткое саммари диалога (1-2 предложения на русском). Затем используй Edit чтобы добавить саммари в начало файла в формате: <!-- SUMMARY: твоё саммари -->`;
    const claude = (0, child_process_1.spawn)('claude', [
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
        }
        else {
            console.error(`Summary generation failed (code ${code})`);
            if (errorOutput) {
                console.error(`Error: ${errorOutput.substring(0, 200)}`);
            }
        }
    });
}
class SessionWatcher {
    constructor(targetProjectPath, options = {}) {
        this.watcher = null;
        this.isRunning = false;
        this.claudeProjectDir = null;
        this.targetProjectPath = path.resolve(targetProjectPath);
        this.options = {
            verbose: false,
            debounceMs: DEBOUNCE_MS,
            ...options
        };
    }
    log(message) {
        const timestamp = new Date().toLocaleTimeString('ru-RU');
        console.log(`[${timestamp}] ${message}`);
    }
    debug(message) {
        if (this.options.verbose) {
            this.log(`DEBUG: ${message}`);
        }
    }
    findDialogPath(sessionId) {
        const dialogFolder = (0, gitignore_1.getDialogFolder)(this.targetProjectPath);
        if (!fs.existsSync(dialogFolder)) {
            return null;
        }
        const files = fs.readdirSync(dialogFolder);
        const match = files.find(f => f.includes(sessionId.substring(0, 8)));
        return match ? path.join(dialogFolder, match) : null;
    }
    scheduleSummary(dialogPath) {
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
    scheduleExport(filePath) {
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
    exportFile(filePath) {
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
            const messages = (0, exporter_1.parseSession)(filePath);
            const dialogMessages = messages.filter(m => m.type === 'user' || m.type === 'assistant');
            if (dialogMessages.length === 0) {
                this.debug(`Skipping ${sessionId} - no dialog messages`);
                return;
            }
            const summaries = messages
                .filter(m => m.type === 'summary')
                .map(m => m.summary || '')
                .filter((s) => s.length > 0);
            const firstTimestamp = dialogMessages[0].timestamp;
            const session = {
                id: sessionId,
                filename,
                projectName: (0, exporter_1.getProjectName)(projectDir),
                projectPath: projectDir,
                date: (0, exporter_1.formatTimestamp)(firstTimestamp),
                dateISO: new Date(firstTimestamp).toISOString().split('T')[0],
                size: `${(stat.size / 1024).toFixed(0)}KB`,
                sizeBytes: stat.size,
                summaries: summaries.slice(0, 5),
                messageCount: dialogMessages.length,
                lastModified: stat.mtime
            };
            // Check if previous session was closed (new session appeared)
            const previousSessionId = activeSessionPerProject.get(projectDir);
            if (previousSessionId && previousSessionId !== sessionId) {
                // Previous session is now closed - generate final summary
                const previousDialogPath = this.findDialogPath(previousSessionId);
                if (previousDialogPath) {
                    this.log(`Session ${previousSessionId.substring(0, 8)} closed, generating final summary...`);
                    requestSummary(previousDialogPath, this.options.verbose, true); // isFinal = true
                }
            }
            activeSessionPerProject.set(projectDir, sessionId);
            // Export to target project's .dialog/ folder
            const result = (0, exporter_1.exportSession)(session, this.targetProjectPath);
            this.log(`Exported: ${path.basename(result.markdownPath)} (${session.messageCount} messages)`);
            // Schedule summary generation (will run after inactivity period)
            this.scheduleSummary(result.markdownPath);
        }
        catch (err) {
            console.error(`Error exporting ${filePath}:`, err);
        }
    }
    async start() {
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
        this.claudeProjectDir = (0, exporter_1.findClaudeProjectDir)(this.targetProjectPath);
        if (!this.claudeProjectDir) {
            console.error(`No Claude sessions found for project: ${this.targetProjectPath}`);
            console.error('Make sure Claude Code has been used in this project.');
            process.exit(1);
        }
        const claudeProjectPath = path.join(exporter_1.PROJECTS_DIR, this.claudeProjectDir);
        const dialogFolder = (0, gitignore_1.ensureDialogFolder)(this.targetProjectPath);
        this.log('Starting Claude Export Watcher...');
        this.log(`Project: ${this.targetProjectPath}`);
        this.log(`Claude sessions: ${claudeProjectPath}`);
        this.log(`Dialogs folder: ${dialogFolder}`);
        this.log('');
        // Initial export of all sessions
        this.log('Performing initial export...');
        const sessions = (0, exporter_1.getProjectSessions)(this.targetProjectPath);
        let newCount = 0;
        let updatedCount = 0;
        for (const session of sessions) {
            const sourcePath = path.join(exporter_1.PROJECTS_DIR, session.projectPath, session.filename);
            const exportedPath = this.findDialogPath(session.id);
            if (!exportedPath) {
                // Not exported yet - export it
                fileSizes.set(sourcePath, session.sizeBytes);
                this.exportFile(sourcePath);
                newCount++;
            }
            else {
                // Already exported - check if JSONL is newer than markdown
                const jsonlStat = fs.statSync(sourcePath);
                const mdStat = fs.statSync(exportedPath);
                if (jsonlStat.mtime > mdStat.mtime) {
                    // JSONL was updated after markdown - re-export
                    this.log(`Updating: ${path.basename(exportedPath)} (source newer)`);
                    fileSizes.set(sourcePath, 0); // Force re-export by setting size to 0
                    this.exportFile(sourcePath);
                    updatedCount++;
                }
                else {
                    // Track existing file sizes
                    fileSizes.set(sourcePath, session.sizeBytes);
                }
            }
        }
        if (newCount === 0 && updatedCount === 0) {
            this.log('All sessions already exported and up to date');
        }
        else {
            if (newCount > 0)
                this.log(`New exports: ${newCount}`);
            if (updatedCount > 0)
                this.log(`Updated: ${updatedCount}`);
        }
        this.log('');
        // Start watching Claude project directory
        this.watcher = chokidar.watch(claudeProjectPath, {
            ignored: [
                /(^|[\/\\])\../, // Ignore dotfiles
                /agent-.*\.jsonl$/, // Ignore agent files
                /.*(?<!\.jsonl)$/ // Only watch .jsonl files
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
        this.log('New and updated sessions will be automatically exported to .dialog/');
    }
    async stop() {
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
exports.SessionWatcher = SessionWatcher;
// Run as standalone
async function startWatcher(targetProjectPath, options = {}) {
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
