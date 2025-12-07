# Project Architecture

**Project:** Claude Export
**Version:** 2.1.0
**Last Updated:** 2025-12-05

---

> **🏗️ Authoritative Source:** This is the SINGLE SOURCE OF TRUTH for:
> - WHY we chose specific technologies
> - HOW the system is structured
> - Design principles and patterns

---

## 📊 Technology Stack

### Runtime & Language
```
- Runtime: Node.js 18+
- Language: TypeScript 5.3+
- Build: tsc (TypeScript Compiler)
- Package Manager: npm
```

### Dependencies
```json
{
  "chokidar": "^3.5.3 - File system watching with debounce",
  "express": "^4.18.2 - Minimal web server for UI"
}
```

### Why These Choices

**TypeScript over JavaScript:**
- ✅ Type safety для сложных структур данных (Message, Session, Dialog)
- ✅ Лучший IDE support и автокомплит
- ✅ Раннее обнаружение ошибок

**Express over other frameworks:**
- ✅ Минимальный footprint (только для статики и простого API)
- ✅ Широко известен, легко поддерживать
- ❌ Не нужен full-featured framework (нет БД, нет auth)

**Chokidar over fs.watch:**
- ✅ Кросс-платформенность
- ✅ Встроенный debounce и awaitWriteFinish
- ✅ Надежная работа с событиями

**No Database:**
- ✅ File system как хранилище — простота
- ✅ .gitignore как "database" для visibility state
- ✅ Zero configuration

---

## 🗂️ Project Structure

```
claude-export/
├── src/                      # TypeScript исходники
│   ├── cli.ts               # CLI entry point и команды
│   ├── exporter.ts          # Core logic: JSONL → Markdown
│   ├── server.ts            # Express сервер и API
│   ├── watcher.ts           # File watching и auto-export
│   └── gitignore.ts         # .gitignore manipulation
│
├── dist/                     # Скомпилированный JavaScript
│   └── *.js                 # Output от tsc
│
├── public/                   # Static web UI
│   └── index.html           # Single-page UI
│
├── node_modules/            # Dependencies
├── package.json             # npm configuration
├── tsconfig.json            # TypeScript configuration
├── release/install.sh       # Installation script
└── README.md                # User documentation
```

---

## 🏗️ Core Architecture Decisions

### 1. CLI-First Design

**Decision:** Утилита работает как CLI с опциональным веб-интерфейсом

**Reasoning:**
- ✅ Универсальность — работает везде где есть Node.js
- ✅ Интеграция с npm scripts
- ✅ Легко автоматизировать (cron, hooks)
- ✅ Простой deployment (копируем папку)

**Alternatives considered:**
- ❌ Desktop app (Electron) — слишком тяжело для простой утилиты
- ❌ Only Web UI — требует постоянно запущенный сервер

---

### 2. Privacy by Default

**Decision:** Все диалоги приватные по умолчанию (добавляются в .gitignore)

**Reasoning:**
- ✅ Безопасность — случайно не опубликуешь приватный диалог
- ✅ GDPR-friendly — данные не уходят в публичный репозиторий
- ✅ Явный opt-in для публикации

**Implementation:**
```typescript
// При экспорте сразу добавляем в .gitignore
export function exportSession(session, targetProjectPath) {
  // ... create markdown ...
  addToGitignore(outputPath, targetProjectPath);
  return { ...result, isPublic: false };
}
```

---

### 3. File System as Database

**Decision:** Используем файловую систему вместо базы данных

**Reasoning:**
- ✅ Zero configuration — не нужно настраивать БД
- ✅ Git-friendly — все данные в файлах, можно коммитить
- ✅ Portable — работает везде
- ✅ Transparency — пользователь видит все файлы

**Data storage:**
- Dialogs: `dialog/*.md` files
- Visibility: `.gitignore` entries

---

### 4. Separation of Concerns

**Decision:** Каждый модуль отвечает за одну задачу

**Modules:**

| Module | Responsibility |
|--------|---------------|
| `cli.ts` | CLI parsing, command routing |
| `exporter.ts` | JSONL parsing, Markdown generation |
| `server.ts` | HTTP API, static files |
| `watcher.ts` | File watching, auto-export |
| `gitignore.ts` | .gitignore read/write |

**Benefits:**
- ✅ Легко тестировать каждый модуль отдельно
- ✅ Минимальные зависимости между модулями
- ✅ AI может работать с одним модулем без понимания всего проекта

---

## 🔧 Key Services & Components

### CLI Module (`cli.ts`)

**Purpose:** Entry point и роутинг команд
**Location:** `src/cli.ts`

**Commands:**
```
init [path]     → runInit()      # First-time setup
watch [path]    → startWatcher() # Background auto-export
ui [path]       → startServer()  # Web interface
export [path]   → runExport()    # One-time export
list [path]     → showList()     # Show sessions
```

**Options:**
- `--port <number>` — UI server port (default: 3333)
- `--verbose, -v` — Enable debug logging

---

### Exporter Module (`exporter.ts`)

**Purpose:** Core conversion logic
**Location:** `src/exporter.ts`

**Key functions:**
```typescript
parseSession(filePath)           // JSONL → Message[]
toMarkdown(messages, session)    // Message[] → Markdown string
exportSession(session, path)     // Full export pipeline
getProjectSessions(path)         // Find Claude sessions for project
```

**Data flow:**
```
~/.claude/projects/-path-to-project/*.jsonl
    ↓ parseSession()
Message[]
    ↓ toMarkdown()
Markdown string
    ↓ fs.writeFileSync()
dialog/YYYY-MM-DD_session-*.md
```

---

### Server Module (`server.ts`)

**Purpose:** Web UI и REST API
**Location:** `src/server.ts`

**API Endpoints:**
```
GET  /api/project           # Current project info
POST /api/project           # Set project path
GET  /api/sessions          # List Claude sessions
GET  /api/dialogs           # List exported dialogs
GET  /api/dialog/:filename  # Get dialog content
POST /api/dialog/toggle/:f  # Toggle visibility
POST /api/export/:path/:id  # Export session
GET  /api/search?q=query    # Search in sessions
```

**Static files:**
- Serves `public/` directory
- SPA fallback to `index.html`

---

### Watcher Module (`watcher.ts`)

**Purpose:** Auto-export новых сессий
**Location:** `src/watcher.ts`

**Architecture:**
```
Chokidar watcher
    ↓ on('change')
Debounce (2s)
    ↓
Export to dialog/
    ↓
Schedule summary (30s)
    ↓
Claude CLI → Add SUMMARY comment
```

**Key features:**
- Debounce prevents multiple exports on rapid changes
- File size tracking avoids duplicate exports
- Summary generation after inactivity period

---

### Gitignore Module (`gitignore.ts`)

**Purpose:** Manage .gitignore entries
**Location:** `src/gitignore.ts`

**Key functions:**
```typescript
addToGitignore(file, project)      // Make private
removeFromGitignore(file, project) // Make public
toggleVisibility(file, project)    // Toggle state
isPublic(file, project)            // Check state
```

**Pattern:**
- Section header: `# Claude dialogs`
- Entries: `dialog/YYYY-MM-DD_session-*.md`

---

## 📡 Data Flow

### 1. Export Flow
```
User runs: npm run dialog:export
    │
    ├── CLI parses command
    │
    ├── exporter.getProjectSessions()
    │   └── Scans ~/.claude/projects/
    │
    ├── For each new session:
    │   ├── parseSession() → Message[]
    │   ├── toMarkdown() → string
    │   ├── Write to dialog/
    │   └── addToGitignore()
    │
    └── Output: "Exported N sessions"
```

### 2. Watch Flow
```
User runs: npm run dialog:watch
    │
    ├── watcher.start()
    │   └── chokidar.watch(~/.claude/projects/)
    │
    ├── On file change:
    │   ├── Debounce 2 seconds
    │   ├── Check file size changed
    │   ├── Export session
    │   └── Schedule summary (30s)
    │
    └── On inactivity:
        └── claude -p "Generate summary..."
```

### 3. UI Flow
```
User opens: http://localhost:3333
    │
    ├── GET /api/project
    │   └── Returns project info
    │
    ├── GET /api/dialogs
    │   └── Returns list with visibility status
    │
    ├── User clicks visibility toggle
    │   └── POST /api/dialog/toggle/:filename
    │       └── Updates .gitignore
    │
    └── User views dialog
        └── GET /api/dialog/:filename
            └── Returns markdown content
```

---

## 🧩 Module Architecture

### Module Dependency Graph

```
cli.ts (entry point)
    │
    ├── exporter.ts (core logic)
    │   └── gitignore.ts (visibility)
    │
    ├── server.ts (web ui)
    │   ├── exporter.ts
    │   └── gitignore.ts
    │
    └── watcher.ts (auto-export)
        ├── exporter.ts
        └── gitignore.ts
```

### Module Independence

Каждый модуль может быть использован отдельно:

```typescript
// Use only exporter
import { parseSession, toMarkdown } from './exporter';

// Use only gitignore
import { toggleVisibility } from './gitignore';
```

---

## 🎯 Development Standards

### Code Organization
- One module = one responsibility
- Export only necessary functions
- Keep functions small (< 50 lines ideally)
- Use TypeScript interfaces for data structures

### Naming Conventions
- camelCase for functions and variables
- PascalCase for interfaces and types
- UPPER_SNAKE_CASE for constants

### Error Handling
- Try/catch in async functions
- User-friendly error messages
- Console.error for internal errors
- Graceful degradation (continue if one file fails)

---

## 📚 Related Documentation

- **CLAUDE.md** — AI instructions (includes security rules)
- **BACKLOG.md** — Current tasks and status
- **SNAPSHOT.md** — Quick project overview

---

*This document maintained for effective development*
*Last updated: 2025-12-05*
