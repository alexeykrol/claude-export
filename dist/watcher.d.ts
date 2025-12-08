/**
 * Watcher - Background daemon that monitors Claude Code sessions
 * for a specific project and exports dialogs to dialog/ folder
 */
export interface WatcherOptions {
    verbose?: boolean;
    debounceMs?: number;
    outputDir?: string;
}
export declare class SessionWatcher {
    private watcher;
    private options;
    private isRunning;
    private targetProjectPath;
    private outputProjectPath;
    private claudeProjectDir;
    constructor(targetProjectPath: string, options?: WatcherOptions);
    /** Get effective output directory (for exports) */
    getOutputPath(): string;
    private log;
    private debug;
    private findDialogPath;
    private scheduleSummary;
    private scheduleExport;
    private exportFile;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export declare function startWatcher(targetProjectPath: string, options?: WatcherOptions): Promise<SessionWatcher>;
