# Project Backlog

**Project:** Claude Export
**Version:** 2.3.0
**Last Updated:** 2025-12-07

> **📋 Authoritative Source:** This is the SINGLE SOURCE OF TRUTH for:
> - ✅ **Detailed implementation plan** with checklists
> - ✅ **Current status** of all features (TODO/IN PROGRESS/DONE)
> - ✅ **Sprint roadmap** and task breakdown
>
> **For AI Agents:**
> When user asks for checklist or "what's next?" → Read THIS file

---

## 📊 Project Status Overview

**Current Phase:** Production (v2.3.0 released)
**Active Sprint:** Bugfix & Stability Sprint
**Completion:** 100% of MVP features + Critical bug fixes

### Quick Stats
- ✅ **Completed:** 22 features
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

- [x] **CLI Interface** - Команды init, watch, ui, export, list
  - Implemented: 2025-12-04
  - Files: `src/cli.ts`
  - Notes: Полный CLI с опциями --port, --verbose

- [x] **Watch Mode** - Автоматический экспорт новых сессий
  - Implemented: 2025-12-04
  - Files: `src/watcher.ts`
  - Notes: Chokidar с debounce 2s

- [x] **Web UI** - Веб-интерфейс для управления диалогами
  - Implemented: 2025-12-04
  - Files: `src/server.ts`, `src/public/`
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


- [x] **Two-Level Summary System** - Двухуровневые саммари (SHORT + FULL)
  - Implemented: 2025-12-05
  - Files: `src/watcher.ts:62-93`, `src/exporter.ts:460-485`, `src/public/index.html`
  - Notes: SUMMARY_SHORT для списка, SUMMARY_FULL для деталей. Генерация через Haiku с debounce 30 минут

- [x] **Force Sync Button** - Синхронизация текущей активной сессии
  - Implemented: 2025-12-05
  - Files: `src/exporter.ts:501-561`, `src/server.ts:333-361`, `src/public/index.html`
  - Notes: Кнопка для принудительной синхронизации текущей активной сессии. Сравнивает JSONL vs MD, добавляет недостающие сообщения.

- [x] **Timezone Fix** - Корректная датировка файлов по локальному времени
  - Implemented: 2025-12-05
  - Files: `src/exporter.ts:150-156`, `src/public/index.html`
  - Notes: Исправлен баг с UTC конвертацией (20:10 PST → 04:10 UTC следующего дня). Теперь используется локальное время.

- [x] **Duplicate Prevention** - Предотвращение дубликатов файлов при изменении формата
  - Implemented: 2025-12-06
  - Files: `src/exporter.ts:389-398`
  - Notes: При изменении логики датировки (UTC → local) старый файл автоматически удаляется. Проверка по session ID, сохранение visibility статуса.

- [x] **Old Format Summary Regeneration** - Автоматическая замена старого формата summary
  - Implemented: 2025-12-06
  - Files: `src/watcher.ts:353-370`
  - Notes: Файлы с `## Summaries` определяются как требующие обновления. Генерация SUMMARY_SHORT и SUMMARY_FULL через Claude CLI. Пропуск файлов >300KB.

- [x] **Summary Generation via stdin** - Корректная передача prompt в Claude CLI
  - Implemented: 2025-12-06
  - Files: `src/watcher.ts:96-109`
  - Notes: Многострочный prompt передаётся через stdin вместо CLI аргумента для корректной обработки.

- [x] **Final Summaries at Cold Start** - Генерация финальных summary для закрытых сессий
  - Implemented: 2025-12-06
  - Files: `src/watcher.ts:340-372`
  - Notes: При cold start определяются закрытые сессии (все кроме текущей активной). Автоматическая генерация двухуровневых summary. Пропуск файлов >300KB для экономии токенов.

- [x] **Watcher Cold Start Reliability** - Надёжный подхват всех сессий при старте
  - Implemented: 2025-12-06
  - Files: `src/watcher.ts:325-338`
  - Notes: Initial export использует `exportNewSessions()` вместо обычного экспорта. Подхватывает ВСЕ неэкспортированные сессии, включая те, что с ошибками парсинга.

- [x] **Static HTML Viewer** - Самодостаточный viewer для студентов/консьюмеров
  - Implemented: 2025-12-06
  - Files: `html-viewer/template.html`, `src/exporter.ts:833-919`
  - Notes: Генерация в `dialog-viewer/index.html`. Все данные встроены как JSON. Не требует Node.js или сервера. Автообновление при каждом экспорте через watcher.

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
- [x] **CLAUDE.md** - AI instructions (merged)
- [x] **BACKLOG.md** - Этот файл
- [x] **ARCHITECTURE.md** - Архитектура
- [x] **SNAPSHOT.md** - Project state
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

### Current Sprint: AI Framework v2.0
**Duration:** 2025-12-07
**Goal:** Рефакторинг AI documentation structure, cleanup проекта

#### Sprint Backlog
- [x] Merge CLAUDE.md + COMPLETION_PROTOCOL.md + SECURITY.md → single CLAUDE.md
- [x] Rename PROJECT_SNAPSHOT.md → SNAPSHOT.md
- [x] Reduce .claude/ from 6 to 4 files
- [x] Move public/ to src/public/
- [x] Remove scripts/ folder (ad-hoc build script)
- [x] Clean release/: single install.sh, remove duplicates
- [x] Add /fi slash command for completion protocol
- [x] Add crash recovery (.last_session with active/clean status)
- [x] Обновить CHANGELOG.md
- [x] Обновить SNAPSHOT.md
- [x] Обновить BACKLOG.md

### Previous Sprint: Bugfix & Stability Sprint
**Duration:** 2025-12-06
**Status:** ✅ Completed

#### Completed Tasks
- [x] Исправить дубликаты файлов при изменении формата даты
- [x] Генерация финальных summary для закрытых сессий при cold start
- [x] Замена старого формата summary на новый (SUMMARY_SHORT/FULL)
- [x] Передача prompt через stdin в Claude CLI
- [x] Улучшить watcher cold start reliability

### Previous Sprint: Documentation & Framework Integration
**Duration:** 2025-12-05
**Status:** ✅ Completed

#### Completed Tasks
- [x] Создать BACKLOG.md
- [x] Создать SNAPSHOT.md
- [x] Создать ARCHITECTURE.md
- [x] Создать CLAUDE.md (merged instructions)
- [x] Создать CHANGELOG.md
- [x] Добавить .claude/commands/
- [x] Обновить CLAUDE.md
- [x] Обновить README.md (полная документация)

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
*Last updated: 2025-12-07*
