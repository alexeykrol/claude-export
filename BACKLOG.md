# Project Backlog

**Project:** Claude Export
**Version:** 2.1.0
**Last Updated:** 2025-12-05

> **📋 Authoritative Source:** This is the SINGLE SOURCE OF TRUTH for:
> - ✅ **Detailed implementation plan** with checklists
> - ✅ **Current status** of all features (TODO/IN PROGRESS/DONE)
> - ✅ **Sprint roadmap** and task breakdown
>
> **For AI Agents:**
> When user asks for checklist or "what's next?" → Read THIS file

---

## 📊 Project Status Overview

**Current Phase:** Production (v2.1.0 released)
**Active Sprint:** Enhancement Sprint
**Completion:** 100% of MVP features

### Quick Stats
- ✅ **Completed:** 12 features
- 🚧 **In Progress:** 0 features
- 📋 **Planned:** 5 enhancements
- 🔴 **Blocked:** 0 features

---

## 🎯 MVP (Minimum Viable Product)

### ✅ Completed Features

- [x] **JSONL Parser** - Парсинг Claude Code сессий из ~/.claude/projects/
  - Implemented: 2025-12-04
  - Files: `src/exporter.ts:95-108`
  - Notes: Поддержка всех типов сообщений (user, assistant, summary)

- [x] **Markdown Exporter** - Конвертация сессий в читаемый Markdown
  - Implemented: 2025-12-04
  - Files: `src/exporter.ts:306-361`
  - Notes: Включает метаданные, автора, timestamps

- [x] **Git Visibility Control** - Управление видимостью через .gitignore
  - Implemented: 2025-12-04
  - Files: `src/gitignore.ts`
  - Notes: По умолчанию приватно, toggle через UI

- [x] **CLI Interface** - Команды init, watch, ui, export, list, tasks
  - Implemented: 2025-12-04
  - Files: `src/cli.ts`
  - Notes: Полный CLI с опциями --port, --verbose

- [x] **Watch Mode** - Автоматический экспорт новых сессий
  - Implemented: 2025-12-04
  - Files: `src/watcher.ts`
  - Notes: Chokidar с debounce 2s

- [x] **Web UI** - Веб-интерфейс для управления диалогами
  - Implemented: 2025-12-04
  - Files: `src/server.ts`, `public/`
  - Notes: Express сервер на порту 3333

- [x] **Auto-Summary** - Автоматическая генерация саммари
  - Implemented: 2025-12-05
  - Files: `src/watcher.ts:39-98`
  - Notes: Через Claude CLI после 30s инактивности

- [x] **Author Attribution** - Атрибуция из git config
  - Implemented: 2025-12-04
  - Files: `src/exporter.ts:21-29`
  - Notes: Имя и email из git config user.name/email

- [x] **Install Script** - Автоматическая установка
  - Implemented: 2025-12-04
  - Files: `install.sh`
  - Notes: npm install + npm scripts в package.json

- [x] **Project Detection** - Определение Claude проекта по пути
  - Implemented: 2025-12-04
  - Files: `src/exporter.ts:155-180`
  - Notes: Конвертация /path/to/project → -path-to-project

- [x] **API Endpoints** - REST API для UI
  - Implemented: 2025-12-04
  - Files: `src/server.ts`
  - Notes: /api/project, /api/sessions, /api/dialogs, etc.

- [x] **Pending Tasks System** - Система задач для саммари
  - Implemented: 2025-12-05
  - Files: `src/exporter.ts:549-602`
  - Notes: JSON файлы в .dialog/.pending/

---

## 📋 Planned Enhancements

### High Priority

1. [ ] **Search in Dialogs** - Поиск по содержимому диалогов
   - Priority: High
   - Dependencies: None
   - Estimated effort: Medium
   - Description: Полнотекстовый поиск по экспортированным Markdown файлам

2. [ ] **Filter by Date/Author** - Фильтрация в UI
   - Priority: High
   - Dependencies: None
   - Estimated effort: Small
   - Description: Добавить фильтры в веб-интерфейс

### Medium Priority

3. [ ] **Export Formats** - Дополнительные форматы экспорта
   - Priority: Medium
   - Dependencies: None
   - Estimated effort: Medium
   - Description: JSON, HTML экспорт помимо Markdown

4. [ ] **Usage Statistics** - Статистика использования
   - Priority: Medium
   - Dependencies: None
   - Estimated effort: Large
   - Description: Количество сессий, сообщений, токенов за период

### Low Priority

5. [ ] **Multi-AI Support** - Поддержка других AI assistants
   - Priority: Low
   - Dependencies: None
   - Estimated effort: Large
   - Description: GitHub Copilot, Cursor, другие AI

---

## 🎨 UI/UX Improvements

### Planned
- [ ] Dark mode для веб-интерфейса
- [ ] Keyboard shortcuts (j/k навигация)
- [ ] Markdown preview с подсветкой синтаксиса

### Completed
- [x] Таблица диалогов с сортировкой
- [x] Toggle видимости одним кликом
- [x] Responsive дизайн

---

## 🐛 Known Issues

### Low Priority
- [ ] **Windows paths** - Утилита не тестировалась на Windows
  - Impact: Windows пользователи
  - Workaround: Использовать WSL
  - Assignee: Future consideration

---

## 🔧 Technical Debt

- [ ] **Add unit tests** - Покрытие тестами
  - Reason: Нет автоматических тестов
  - Benefit: Надежность при рефакторинге
  - Effort: Medium (4-6 hours)

- [ ] **Type strictness** - Убрать `any` типы
  - Reason: Несколько мест с `any`
  - Benefit: Лучшая типобезопасность
  - Effort: Small (1-2 hours)

---

## 📚 Documentation Tasks

- [x] **README.md** - Полная документация
- [x] **PROJECT_INTAKE.md** - Описание проекта
- [x] **BACKLOG.md** - Этот файл
- [x] **ARCHITECTURE.md** - Архитектура
- [x] **SECURITY.md** - Безопасность
- [x] **CHANGELOG.md** - История изменений

---

## 🚀 Future Enhancements (Post-MVP)

### v3.0 Ideas
- [ ] **Cloud sync** - Синхронизация между устройствами
- [ ] **Team features** - Шаринг в команде
- [ ] **AI insights** - Анализ паттернов использования AI

### Nice to Have
- [ ] **Browser extension** - Экспорт из claude.ai
- [ ] **VSCode extension** - Интеграция с IDE
- [ ] **Slack integration** - Публикация диалогов в Slack

---

## 📋 Sprint Planning

### Current Sprint: Documentation & Framework Integration
**Duration:** 2025-12-05
**Goal:** Добавить мета-файлы фреймворка

#### Sprint Backlog
- [x] Создать PROJECT_INTAKE.md
- [x] Создать BACKLOG.md
- [ ] Создать PROJECT_SNAPSHOT.md
- [ ] Создать ARCHITECTURE.md
- [ ] Создать SECURITY.md
- [ ] Создать WORKFLOW.md
- [ ] Создать PROCESS.md
- [ ] Создать CHANGELOG.md
- [ ] Добавить .claude/commands/
- [ ] Обновить CLAUDE.md

---

## 📝 Decision Log

### 2025-12-04 - .dialog/ folder naming
**Decision:** Использовать `.dialog/` вместо `*dialog/`
**Reason:** Точка в начале обозначает системную папку (как .git, .vscode)
**Impact:** Папка скрыта по умолчанию в файловых менеджерах

### 2025-12-04 - Privacy by default
**Decision:** Все диалоги приватные по умолчанию
**Reason:** Безопасность — пользователь должен явно публиковать
**Impact:** Требуется ручное переключение для публикации

### 2025-12-05 - Auto-summary via Claude CLI
**Decision:** Использовать `claude -p` для генерации саммари
**Reason:** Нет API ключей, использует существующую авторизацию
**Impact:** Требуется установленный Claude CLI

---

## 🎯 Priority Matrix

```
High Impact, Quick Win → Do FIRST
│ - Search in dialogs
│ - Filter by date/author

High Impact, Long Term → Do SECOND
│ - Usage statistics
│ - Export formats

Low Impact, Quick Win → Do THIRD
│ - Dark mode UI
│ - Keyboard shortcuts

Low Impact, Long Term → Do LAST
│ - Multi-AI support
│ - Cloud sync
```

---

*This is the SINGLE SOURCE OF TRUTH for project status*
*Last updated: 2025-12-05*
