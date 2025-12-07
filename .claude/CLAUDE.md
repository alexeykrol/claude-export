# CLAUDE.md — AI Agent Instructions

**Project:** Claude Export v2.3.0
**Purpose:** Export Claude Code dialogs for students (Producer → Consumer)

## Triggers

**"заверши", "завершить", "финиш", "закончи", "done", "finish":**
→ Execute Completion Protocol (section below)

## Cold Start Protocol

### Step 0: Crash Recovery

Check `.claude/.last_session`:
```bash
cat .claude/.last_session
```

- If `"status": "active"` → Previous session crashed:
  1. `npm run dialog:export` — export missed dialogs
  2. `git status` — check uncommitted changes
  3. Ask: "Continue or commit first?"
- If `"status": "clean"` → OK, continue

Mark session as active:
```bash
echo '{"status": "active", "timestamp": "'$(date -Iseconds)'"}' > .claude/.last_session
```

### Step 1: Load Context

Read `SNAPSHOT.md` — current project state

### Step 2: On Demand

- `BACKLOG.md` — tasks
- `ARCHITECTURE.md` — modules structure

### Step 3: Confirm

```
Context loaded. Directory: [pwd]
Project: Claude Export v2.3.0 (production)
```

## Completion Protocol

Execute on trigger words. Steps:

### 1. Build
```bash
npm run build
```

### 2. Update Versions

Find and update everywhere:
```bash
grep -r "version.*2\." --include="*.json" --include="*.md" --include="*.ts"
```

Locations: `package.json`, `README.md`, `CHANGELOG.md`, `.claude/CLAUDE.md`, `.claude/SNAPSHOT.md`

### 3. Update Metafiles

Required:
- `.claude/BACKLOG.md` — mark completed tasks `[x]`
- `.claude/SNAPSHOT.md` — update date and progress
- `CHANGELOG.md` — add entry

If significant changes:
- `.claude/ARCHITECTURE.md` — if architecture changed
- This file — if instructions changed

### 4. Export Dialogs
```bash
npm run dialog:export
```

### 5. Git Commit
```bash
git add -A
git status
git commit -m "$(cat <<'EOF'
type: Brief description

- Detail 1
- Detail 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Commit types: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`

### 6. Ask About Push

```
Commit created. Push to remote?
```

### 7. Mark Session Clean
```bash
echo '{"status": "clean", "timestamp": "'$(date -Iseconds)'"}' > .claude/.last_session
```

## Security Rules

### Principles
- **Privacy by default** — dialogs private, added to .gitignore
- **Local processing** — no external APIs
- **No telemetry** — no data sent anywhere

### Never Do
- Add external API calls
- Break privacy model
- Add telemetry/analytics
- Ignore TypeScript errors
- Store data outside `.dialog/`

### Always Do
- Keep dialogs private by default
- Process locally
- Update BACKLOG.md and CHANGELOG.md

## Project Structure

```
src/
├── cli.ts         # CLI (init, watch, ui, export, list)
├── exporter.ts    # JSONL → Markdown
├── server.ts      # Express API
├── watcher.ts     # Chokidar file watching
└── gitignore.ts   # .gitignore manipulation
```

## Commands

### Development
```bash
npm run build          # Compile TypeScript
npm run dev            # Run via ts-node
```

### Usage (in target project)
```bash
npm run dialog:export  # Export + HTML viewer
npm run dialog:ui      # Web interface
npm run dialog:watch   # Auto-export
npm run dialog:list    # List dialogs
```

## Code Style

- ES modules (import/export)
- Strict typing, avoid `any`
- camelCase functions/variables
- PascalCase interfaces
- UPPER_SNAKE_CASE constants

## Data Flow

```
~/.claude/projects/*.jsonl
    → Chokidar detect
    → Debounce 2s
    → Export to dialog/
    → Add to .gitignore
    → Schedule summary (30min)
```

## API Endpoints

```
GET  /api/project           # Project info
GET  /api/sessions          # Claude sessions list
GET  /api/dialogs           # Exported dialogs
POST /api/dialog/toggle/:f  # Toggle visibility
GET  /api/search?q=query    # Search
```

## State Files

| File | Purpose |
|------|---------|
| `SNAPSHOT.md` | Project state for cold start |
| `BACKLOG.md` | Tasks status |
| `ARCHITECTURE.md` | Code structure |
| `.last_session` | Session status (clean/active) |

## Slash Commands

Available in `.claude/commands/`:
`/fix`, `/feature`, `/review`, `/test`, `/security`, `/explain`, `/refactor`, `/optimize`, `/commit`, `/fi`

## Troubleshooting

**Build errors:** `rm -rf dist/ && npm run build`
**Watch not working:** Check ~/.claude/projects/ has sessions
**UI won't open:** Port 3333 busy? Use `--port`

---
*Version: 2.3.0 | Updated: 2025-12-07*
