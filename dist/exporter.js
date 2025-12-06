"use strict";
/**
 * Exporter - Convert Claude Code JSONL sessions to Markdown
 * Saves dialogs to .dialog/ folder inside the target project
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
exports.PROJECTS_DIR = exports.CLAUDE_DIR = void 0;
exports.getGitAuthor = getGitAuthor;
exports.getProjectName = getProjectName;
exports.getProjectFullPath = getProjectFullPath;
exports.parseSession = parseSession;
exports.extractContent = extractContent;
exports.formatTimestamp = formatTimestamp;
exports.formatDate = formatDate;
exports.formatDateISO = formatDateISO;
exports.findClaudeProjectDir = findClaudeProjectDir;
exports.getProjectSessions = getProjectSessions;
exports.getAllSessions = getAllSessions;
exports.toMarkdown = toMarkdown;
exports.exportSession = exportSession;
exports.getExportedDialogs = getExportedDialogs;
exports.isSessionExported = isSessionExported;
exports.getExportedPath = getExportedPath;
exports.exportNewSessions = exportNewSessions;
exports.extractSummary = extractSummary;
exports.hasSummary = hasSummary;
exports.getSummary = getSummary;
exports.setSummary = setSummary;
exports.getPendingFolder = getPendingFolder;
exports.ensurePendingFolder = ensurePendingFolder;
exports.createSummaryTask = createSummaryTask;
exports.getPendingTasks = getPendingTasks;
exports.completeTask = completeTask;
exports.getDialogWithSummary = getDialogWithSummary;
exports.getExportedDialogsWithSummaries = getExportedDialogsWithSummaries;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const gitignore_1 = require("./gitignore");
/**
 * Get git user info for author attribution
 */
function getGitAuthor() {
    try {
        const name = (0, child_process_1.execSync)('git config user.name', { encoding: 'utf-8' }).trim();
        const email = (0, child_process_1.execSync)('git config user.email', { encoding: 'utf-8' }).trim();
        return { name: name || 'Unknown', email: email || '' };
    }
    catch {
        return { name: os.userInfo().username || 'Unknown', email: '' };
    }
}
// Paths
exports.CLAUDE_DIR = path.join(os.homedir(), '.claude');
exports.PROJECTS_DIR = path.join(exports.CLAUDE_DIR, 'projects');
// Helpers
function getProjectName(projectPath) {
    // Convert "-Users-alex-Code-MyProject" to "MyProject"
    const parts = projectPath.split('-').filter(p => p.length > 0);
    return parts[parts.length - 1] || projectPath;
}
function getProjectFullPath(projectPath) {
    // Convert "-Users-alex-Code-MyProject" to "/Users/alex/Code/MyProject"
    return projectPath.replace(/^-/, '/').replace(/-/g, '/');
}
function parseSession(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    return lines
        .map(line => {
        try {
            return JSON.parse(line);
        }
        catch {
            return null;
        }
    })
        .filter((msg) => msg !== null);
}
function extractContent(msg) {
    if (!msg.message?.content)
        return '';
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
function formatTimestamp(ts) {
    return new Date(ts).toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}
function formatDate(ts) {
    return new Date(ts).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}
function formatDateISO(ts) {
    return new Date(ts).toISOString().split('T')[0];
}
/**
 * Find Claude project directory for a given real project path
 * Converts /Users/alex/Code/MyProject to -Users-alex-Code-MyProject
 */
function findClaudeProjectDir(realProjectPath) {
    const normalized = realProjectPath.replace(/\//g, '-');
    if (fs.existsSync(path.join(exports.PROJECTS_DIR, normalized))) {
        return normalized;
    }
    // Try without leading dash
    const withoutLeading = normalized.replace(/^-/, '');
    if (fs.existsSync(path.join(exports.PROJECTS_DIR, '-' + withoutLeading))) {
        return '-' + withoutLeading;
    }
    // Search for matching directory
    if (!fs.existsSync(exports.PROJECTS_DIR)) {
        return null;
    }
    const dirs = fs.readdirSync(exports.PROJECTS_DIR);
    const match = dirs.find(d => {
        const fullPath = getProjectFullPath(d);
        return fullPath === realProjectPath || fullPath === path.resolve(realProjectPath);
    });
    return match || null;
}
/**
 * Get all sessions from Claude for a specific project
 */
function getProjectSessions(realProjectPath) {
    const claudeProjectDir = findClaudeProjectDir(realProjectPath);
    if (!claudeProjectDir) {
        return [];
    }
    const projectPath = path.join(exports.PROJECTS_DIR, claudeProjectDir);
    const files = fs.readdirSync(projectPath)
        .filter(f => f.endsWith('.jsonl') && !f.startsWith('agent-'));
    const sessions = [];
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
                date: formatTimestamp(firstTimestamp),
                dateISO: formatDateISO(firstTimestamp),
                size: `${(stat.size / 1024).toFixed(0)}KB`,
                sizeBytes: stat.size,
                summaries: summaries.slice(0, 5),
                messageCount: dialogMessages.length,
                lastModified: stat.mtime
            });
        }
        catch (err) {
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
function getAllSessions() {
    if (!fs.existsSync(exports.PROJECTS_DIR)) {
        return [];
    }
    const projectDirs = fs.readdirSync(exports.PROJECTS_DIR)
        .filter(d => {
        const fullPath = path.join(exports.PROJECTS_DIR, d);
        return fs.statSync(fullPath).isDirectory();
    });
    const sessions = [];
    for (const projectDir of projectDirs) {
        const projectPath = path.join(exports.PROJECTS_DIR, projectDir);
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
                    date: formatTimestamp(firstTimestamp),
                    dateISO: formatDateISO(firstTimestamp),
                    size: `${(stat.size / 1024).toFixed(0)}KB`,
                    sizeBytes: stat.size,
                    summaries: summaries.slice(0, 5),
                    messageCount: dialogMessages.length,
                    lastModified: stat.mtime
                });
            }
            catch (err) {
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
function toMarkdown(messages, session) {
    const dialogMessages = messages.filter(m => m.type === 'user' || m.type === 'assistant');
    const summaries = messages.filter(m => m.type === 'summary');
    const author = getGitAuthor();
    const lines = [];
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
        if (!content.trim())
            continue;
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
 * Export session to markdown file in target project's .dialog/ folder
 * @param session - Session info
 * @param targetProjectPath - Real path to target project (where .dialog/ will be created)
 * @returns ExportedSession info
 */
function exportSession(session, targetProjectPath) {
    const sourcePath = path.join(exports.PROJECTS_DIR, session.projectPath, session.filename);
    const messages = parseSession(sourcePath);
    const markdown = toMarkdown(messages, session);
    // Ensure .dialog folder exists
    const dialogFolder = (0, gitignore_1.ensureDialogFolder)(targetProjectPath);
    // Create filename: 2025-12-05_session-abc12345.md
    const shortId = session.id.substring(0, 8);
    const filename = `${session.dateISO}_session-${shortId}.md`;
    const outputPath = path.join(dialogFolder, filename);
    // Write markdown file
    fs.writeFileSync(outputPath, markdown);
    // Add to .gitignore by default (private)
    (0, gitignore_1.addToGitignore)(outputPath, targetProjectPath);
    return {
        id: session.id,
        projectName: session.projectName,
        date: session.date,
        summaries: session.summaries,
        messageCount: session.messageCount,
        filename,
        markdownPath: outputPath,
        exportedAt: new Date().toISOString(),
        isPublic: false // Private by default
    };
}
/**
 * Get list of exported dialogs in project's .dialog/ folder
 */
function getExportedDialogs(targetProjectPath) {
    const dialogFiles = (0, gitignore_1.getDialogFiles)(targetProjectPath);
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
            isPublic: (0, gitignore_1.isPublic)(filePath, targetProjectPath),
            size: `${(stat.size / 1024).toFixed(0)}KB`,
            sizeBytes: stat.size,
            lastModified: stat.mtime
        };
    });
}
/**
 * Check if session is already exported in target project
 */
function isSessionExported(sessionId, targetProjectPath) {
    const shortId = sessionId.substring(0, 8);
    const dialogFolder = (0, gitignore_1.getDialogFolder)(targetProjectPath);
    if (!fs.existsSync(dialogFolder)) {
        return false;
    }
    const files = fs.readdirSync(dialogFolder);
    return files.some(f => f.includes(`session-${shortId}`));
}
/**
 * Get the markdown path if session is exported
 */
function getExportedPath(sessionId, targetProjectPath) {
    const shortId = sessionId.substring(0, 8);
    const dialogFolder = (0, gitignore_1.getDialogFolder)(targetProjectPath);
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
function exportNewSessions(targetProjectPath) {
    const sessions = getProjectSessions(targetProjectPath);
    const newExports = [];
    for (const session of sessions) {
        if (!isSessionExported(session.id, targetProjectPath)) {
            try {
                const result = exportSession(session, targetProjectPath);
                newExports.push(result);
                console.log(`Exported: ${path.basename(result.markdownPath)}`);
            }
            catch (err) {
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
function extractSummary(content) {
    const match = content.match(SUMMARY_PATTERN);
    return match ? match[1] : null;
}
/**
 * Check if dialog file has a summary
 */
function hasSummary(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return SUMMARY_PATTERN.test(content);
}
/**
 * Get summary from dialog file
 */
function getSummary(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return extractSummary(content);
}
/**
 * Add or update summary in dialog file
 */
function setSummary(filePath, summary) {
    let content = fs.readFileSync(filePath, 'utf-8');
    if (SUMMARY_PATTERN.test(content)) {
        // Update existing summary
        content = content.replace(SUMMARY_PATTERN, `<!-- SUMMARY: ${summary} -->`);
    }
    else {
        // Add summary at the beginning
        content = `<!-- SUMMARY: ${summary} -->\n\n${content}`;
    }
    fs.writeFileSync(filePath, content);
}
/**
 * Get pending folder path
 */
function getPendingFolder(projectPath) {
    return path.join((0, gitignore_1.getDialogFolder)(projectPath), PENDING_FOLDER);
}
/**
 * Ensure pending folder exists
 */
function ensurePendingFolder(projectPath) {
    const pendingPath = getPendingFolder(projectPath);
    if (!fs.existsSync(pendingPath)) {
        fs.mkdirSync(pendingPath, { recursive: true });
    }
    return pendingPath;
}
/**
 * Create a summary request task
 */
function createSummaryTask(filename, projectPath) {
    const pendingFolder = ensurePendingFolder(projectPath);
    const taskId = `summary-${Date.now()}`;
    const taskPath = path.join(pendingFolder, `${taskId}.json`);
    const task = {
        id: taskId,
        type: 'summary',
        filename,
        dialogPath: path.join((0, gitignore_1.getDialogFolder)(projectPath), filename),
        createdAt: new Date().toISOString(),
        status: 'pending'
    };
    fs.writeFileSync(taskPath, JSON.stringify(task, null, 2));
    return taskId;
}
/**
 * Get all pending tasks
 */
function getPendingTasks(projectPath) {
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
function completeTask(taskId, projectPath) {
    const pendingFolder = getPendingFolder(projectPath);
    const taskPath = path.join(pendingFolder, `${taskId}.json`);
    if (fs.existsSync(taskPath)) {
        fs.unlinkSync(taskPath);
    }
}
/**
 * Get dialog info with summary
 */
function getDialogWithSummary(filePath, projectPath) {
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
        isPublic: (0, gitignore_1.isPublic)(filePath, projectPath),
        size: `${(stat.size / 1024).toFixed(0)}KB`,
        sizeBytes: stat.size,
        lastModified: stat.mtime,
        summary: extractSummary(content)
    };
}
/**
 * Get all dialogs with summaries
 */
function getExportedDialogsWithSummaries(targetProjectPath) {
    const dialogFiles = (0, gitignore_1.getDialogFiles)(targetProjectPath);
    return dialogFiles.map(filePath => getDialogWithSummary(filePath, targetProjectPath));
}
