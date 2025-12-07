# PROJECT SNAPSHOT — Текущее состояние проекта

*Последнее обновление: 2025-12-07 12:00*

> **Для Cold Start Protocol:** Этот файл даёт мгновенный обзор проекта!
>
> AI читает этот файл ПЕРВЫМ для понимания текущего состояния.

---

## Статус разработки

**Phase 1: MVP Core** — ЗАВЕРШЕНА
**Phase 2: UI & Watch** — ЗАВЕРШЕНА
**Phase 3: Auto-Summary** — ЗАВЕРШЕНА
**Phase 4: Documentation** — ЗАВЕРШЕНА

**Общий прогресс:** 100%

**Версия:** v2.3.0 (Production)

---

## Установленные зависимости

### Production:
- `chokidar` ^3.5.3 — File watching
- `express` ^4.18.2 — Web server

### Development:
- `@types/express` ^4.17.21
- `@types/node` ^20.10.5
- `ts-node` ^10.9.2
- `typescript` ^5.3.3

---

## Структура проекта

```
claude-export/
├── src/                          # TypeScript исходники
│   ├── cli.ts                    # CLI интерфейс
│   ├── exporter.ts               # JSONL → Markdown
│   ├── server.ts                 # Express сервер
│   ├── watcher.ts                # File watcher
│   └── gitignore.ts              # .gitignore управление
│
├── dist/                         # Скомпилированный JavaScript
│
├── public/                       # Статический UI (для Express)
│   └── index.html
│
├── html-viewer/                  # Шаблон статического viewer
│   └── template.html
│
├── release/                      # Дистрибутивы
│   └── install.sh
│
├── dialog/                       # Экспортированные диалоги (создается)
│
├── package.json
├── tsconfig.json
├── README.md                     # Полная документация
├── CLAUDE.md                     # Контекст для AI
│
├── BACKLOG.md                    # Статус задач
├── PROJECT_SNAPSHOT.md           # Этот файл
├── ARCHITECTURE.md               # Архитектура
├── SECURITY.md                   # Безопасность
├── PROCESS.md                    # Процессы разработки
└── CHANGELOG.md                  # История изменений
```

---

## Ключевые функции

- JSONL → Markdown конвертация
- Git visibility control через .gitignore
- Watch режим с автоэкспортом
- Веб-интерфейс управления
- Статический HTML viewer (для студентов)
- Двухуровневые саммари (SHORT + FULL)
- Author attribution из git config

---

## Модули и их статус

| Модуль | Статус | Описание |
|--------|--------|----------|
| cli.ts | Готов | CLI интерфейс |
| exporter.ts | Готов | JSONL → Markdown |
| server.ts | Готов | Express API |
| watcher.ts | Готов | File watching |
| gitignore.ts | Готов | .gitignore utils |

---

## Технологии

- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.3+
- **Build:** tsc (TypeScript Compiler)
- **Web Server:** Express 4.18
- **File Watching:** Chokidar 3.5
- **Storage:** File system (no database)

---

## Build команды

```bash
npm run build          # Компиляция TypeScript
npm run dialog:export  # Экспорт + HTML viewer
npm run dialog:ui      # Веб-интерфейс
npm run dialog:watch   # Автоэкспорт
npm run dialog:list    # Список диалогов
```

---

## Безопасность

- Локальная обработка данных
- Приватность по умолчанию
- Нет внешних API

---

*Этот файл — SINGLE SOURCE OF TRUTH для текущего состояния проекта*
