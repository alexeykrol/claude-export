# Changelog

All notable changes to Claude Export will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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
