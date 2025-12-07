# SNAPSHOT — Project State

*Updated: 2025-12-07*

## Status

**Version:** v2.3.0 (Production)
**Progress:** 100%

All phases completed:
- Phase 1: MVP Core
- Phase 2: UI & Watch
- Phase 3: Auto-Summary
- Phase 4: Documentation

## Dependencies

**Production:** chokidar ^3.5.3, express ^4.18.2
**Development:** typescript ^5.3.3, ts-node ^10.9.2, @types/node, @types/express

## Structure

```
claude-export/
├── src/                   # TypeScript source
│   ├── cli.ts             # CLI interface
│   ├── exporter.ts        # JSONL → Markdown
│   ├── server.ts          # Express server
│   ├── watcher.ts         # File watcher
│   ├── gitignore.ts       # .gitignore utils
│   └── public/            # Static UI files
├── dist/                  # Compiled JS
├── html-viewer/           # Viewer template
├── release/               # Distribution
├── dialog/                # Exported dialogs
├── package.json
├── README.md              # Human docs
├── CHANGELOG.md           # Human changelog
└── .claude/               # AI files
    ├── CLAUDE.md          # Instructions (auto-loaded)
    ├── SNAPSHOT.md        # This file
    ├── BACKLOG.md         # Tasks
    ├── ARCHITECTURE.md    # Code structure
    ├── .last_session      # Session status
    └── commands/          # Slash commands
```

## Modules

| Module | Status | Purpose |
|--------|--------|---------|
| cli.ts | Ready | CLI interface |
| exporter.ts | Ready | JSONL → Markdown |
| server.ts | Ready | Express API |
| watcher.ts | Ready | File watching |
| gitignore.ts | Ready | .gitignore utils |

## Features

- JSONL → Markdown conversion
- Git visibility control via .gitignore
- Watch mode with auto-export
- Web UI for management
- Static HTML viewer for students
- Two-level summaries (SHORT + FULL)
- Author attribution from git config

## Tech Stack

- Runtime: Node.js 18+
- Language: TypeScript 5.3+
- Build: tsc
- Web: Express 4.18
- Watch: Chokidar 3.5
- Storage: File system (no database)

## Commands

```bash
npm run build          # Compile
npm run dialog:export  # Export + HTML
npm run dialog:ui      # Web interface
npm run dialog:watch   # Auto-export
npm run dialog:list    # List dialogs
```

---
*Single source of truth for project state*
