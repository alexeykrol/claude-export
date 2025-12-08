# Changelog

All notable changes to Claude Export will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [2.4.0] - 2025-12-07

### Added
- **/fi** slash command — Быстрый доступ к Completion Protocol из CLI

### Changed
- **AI Framework v2.0** — Major refactoring of AI documentation structure
  - Merged CLAUDE.md + COMPLETION_PROTOCOL.md + SECURITY.md into single CLAUDE.md
  - Renamed PROJECT_SNAPSHOT.md → SNAPSHOT.md
  - Reduced from 6 files to 4 files in .claude/
  - Cleaner format: removed noise (emojis, decorations), kept essential info
  - ~400 lines → ~200 lines (50% reduction)

- **Crash Recovery** — Added session status tracking
  - `.last_session` marker file with active/clean status
  - Cold start checks for crashed sessions
  - Recovery protocol: export missed dialogs, check uncommitted changes

- **Project Structure Cleanup**
  - Moved `public/` to `src/public/` (fewer folders in root)
  - Removed `scripts/` folder (ad-hoc build script)
  - Cleaned `release/`: single install.sh, regenerated archives
  - Updated server.ts paths for new structure

---

## [2.3.0] - 2025-12-06

### Added
- **Static HTML Viewer** — Самодостаточный HTML-просмотрщик для студентов/консьюмеров
  - Генерируется в `dialog-viewer/index.html` — видимая папка, можно открыть двойным кликом
  - Все данные диалогов встроены как JSON внутри HTML
  - Не требует Node.js, сервера или npm — просто открыть в браузере
  - Полный функционал: список сессий, просмотр диалогов, Markdown рендеринг
  - `html-viewer/template.html` — шаблон статического viewer'а
  - `generateStaticHtml()` function in `src/exporter.ts`
  - Интеграция с watcher — автообновление при каждом экспорте

### Changed
- **Producer/Consumer pattern** — Разделение на полное окружение (учитель) и read-only HTML (студент)
  - Учитель: `npm run dialog:watch` + `npm run dialog:ui` для полного контроля
  - Студент: Просто открывает `dialog-viewer/index.html` в браузере

---

## [2.2.2] - 2025-12-06

### Added
- **Final summaries at cold start** — Генерация финальных summary для закрытых сессий
  - При cold start определяются закрытые сессии (все кроме текущей активной)
  - Автоматическая генерация двухуровневых summary (SHORT + FULL)
  - Пропуск больших файлов (>300KB) для экономии токенов
  - `watcher.ts:340-372` — логика генерации при старте

### Fixed
- **Duplicate file prevention** — Устранено создание дубликатов при изменении формата даты
  - Исправлено: При изменении логики определения даты (UTC → local) создавались дубликаты
  - Теперь перед записью проверяется существующий файл по session ID
  - Старый файл с другой датой автоматически удаляется
  - Visibility статус сохраняется при переименовании
  - `exporter.ts:389-398` — проверка и удаление дубликатов

- **Old format summary regeneration** — Замена старых summary на новый формат
  - Файлы со старым форматом (`## Summaries`) определяются как требующие обновления
  - Автоматическая генерация новых SUMMARY_SHORT и SUMMARY_FULL
  - `watcher.ts:356-370` — проверка формата summary

- **Summary generation via stdin** — Исправлена передача prompt в Claude CLI
  - Исправлено: Многострочный prompt передавался как аргумент командной строки
  - Теперь prompt передаётся через stdin для корректной обработки
  - `watcher.ts:102-109` — использование stdin для prompt

- **Watcher cold start reliability** — Initial export теперь использует `exportNewSessions()`
  - Исправлено: Watcher при холодном старте молчаливо пропускал сессии с ошибками парсинга
  - Теперь использует ту же надёжную логику, что и CLI команда `export`
  - Подхватывает ВСЕ неэкспортированные сессии при запуске

- **Chokidar watch configuration** — Упрощена и улучшена конфигурация file watching
  - Удалён проблемный regex паттерн `/.*(?<!\.jsonl)$/` который блокировал события
  - Добавлен polling mode (`usePolling: true`) для большей надёжности
  - Уменьшен `stabilityThreshold` до 500ms для быстрого отклика
  - Добавлен `depth: 0` для оптимизации

---

## [2.2.1] - 2025-12-05

### Added
- **Force Sync button** — Кнопка для синхронизации текущей активной сессии
  - `syncCurrentSession()` function in `src/exporter.ts`
  - POST `/api/force-export` endpoint in `src/server.ts`
  - UI button in Sessions panel with toast notifications
  - Shows "Already up to date" or "Added N message(s)"

### Fixed
- **Timezone bug in file naming** — Файлы теперь датируются по локальному времени, а не UTC
  - `formatDateISO()` in `src/exporter.ts` uses local time
  - `formatDateTime()` in `public/index.html` uses local time
  - Fixed files being dated next day due to UTC conversion (20:10 PST → 04:10 UTC next day)

---

## [2.2.0] - 2025-12-05

### Added
- **Two-level summary system** — SUMMARY_SHORT (одно предложение) и SUMMARY_FULL (3-5 предложений)
- **Haiku model for summaries** — Генерация саммари через `--model haiku` для экономии токенов

### Changed
- **Extended summary debounce** — Увеличен с 30 секунд до 30 минут для снижения затрат
- Summary generation теперь использует Claude Haiku вместо Sonnet

### Fixed
- **Visibility preservation** — Watcher теперь сохраняет статус публичности файлов при обновлении
  - Проблема: exportSession() безусловно добавлял файлы в .gitignore при каждом обновлении
  - Решение: Проверка существования файла, сохранение текущего статуса visibility
  - Файлы: `src/exporter.ts:384-398`
- **Watcher auto-start** — Watcher теперь корректно экспортирует текущую сессию в реальном времени
- Исправлена проблема с отображением активной сессии в UI

---

## [2.1.0] - 2025-12-05

### Added
- **Auto-summary generation** — Автоматическая генерация саммари через Claude CLI
- **Pending tasks system** — Система задач в `.dialog/.pending/`
- **Author attribution** — Атрибуция автора из `git config user.name/email`
- **Summary comments** — `<!-- SUMMARY: ... -->` в начале файлов
- **Tasks CLI command** — `claude-export tasks` для просмотра pending задач

### Changed
- Watch mode теперь ждет 30 секунд инактивности перед генерацией саммари
- Улучшено логирование в watch режиме

### Fixed
- Debounce теперь корректно работает при быстрых изменениях файлов
- Исправлена обработка пустых сессий

---

## [2.0.0] - 2025-12-04

### Added
- **Web UI** — Веб-интерфейс для управления диалогами на http://localhost:3333
- **REST API** — Полноценный API для всех операций
- **Watch mode** — Автоматический экспорт новых сессий
- **Toggle visibility** — Переключение публичности через UI
- **Search** — Поиск по сессиям

### Changed
- Переименование папки с `*dialog/` на `.dialog/` (системная папка)
- Структура репозитория упрощена

### Removed
- Дублирующаяся папка .claude-export внутри проекта

---

## [1.0.0] - 2025-12-04

### Added
- **Initial release**
- **JSONL Parser** — Парсинг Claude Code сессий
- **Markdown Exporter** — Конвертация в читаемый формат
- **Git visibility control** — Управление через .gitignore
- **CLI commands** — init, export, list
- **Install script** — Автоматическая установка

### Features
- Экспорт диалогов в `.dialog/` папку проекта
- Приватность по умолчанию (все в .gitignore)
- Author attribution из git config
- Поддержка всех типов сообщений (user, assistant, summary)

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|-----------|
| 2.4.0 | 2025-12-07 | AI Framework v2.0, /fi command |
| 2.3.0 | 2025-12-06 | Static HTML Viewer for students |
| 2.2.2 | 2025-12-06 | Final summaries, duplicate fix |
| 2.2.1 | 2025-12-05 | Force Sync button, timezone bug fix |
| 2.2.0 | 2025-12-05 | Two-level summaries, Haiku model |
| 2.1.0 | 2025-12-05 | Auto-summary, pending tasks |
| 2.0.0 | 2025-12-04 | Web UI, watch mode, API |
| 1.0.0 | 2025-12-04 | Initial release, core features |

---

## Upgrade Notes

### From 1.x to 2.x
- Папка переименована с `*dialog/` на `.dialog/`
- Добавлены npm scripts в package.json
- Рекомендуется переустановить: `.claude-export/install.sh`

### From 2.0 to 2.1
- Обратно совместимо
- Новые функции опциональны

---

*Maintained by Claude Export team*
