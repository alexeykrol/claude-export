# Claude Export

![Version](https://img.shields.io/badge/version-2.4.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)

CLI-утилита для экспорта диалогов Claude Code из `~/.claude/projects/` в читаемый Markdown формат с управлением видимостью через `.gitignore`.

---

## Проблема

Диалоги Claude Code хранятся в системной директории (`~/.claude/projects/`) в формате JSONL и:
- Недоступны для просмотра в проекте
- Не могут быть включены в Git историю
- Невозможно поделиться с командой
- Сложно искать и анализировать

**Почему существующие решения не работают:**
- Нет встроенного экспорта в Claude Code
- Ручное копирование JSONL файлов нечитаемо
- Нет механизма управления приватностью диалогов

---

## Решение

1. **Экспорт** — конвертирует JSONL сессии в читаемый Markdown
2. **Локализация** — сохраняет диалоги в `dialog/` папку проекта
3. **Приватность** — по умолчанию добавляет в `.gitignore`
4. **Автоматизация** — watch-режим для автоматического экспорта
5. **UI** — веб-интерфейс для управления диалогами
6. **Viewer** — статический HTML для студентов (без node.js)
7. **Авторство** — автоматическая атрибуция из `git config`

---

## Целевая аудитория

- **Разработчики** — использующие Claude Code ежедневно
- **Преподаватели** — демонстрирующие работу с AI студентам
- **Команды** — практикующие AI-assisted разработку

---

## Структура после установки

```
your-project/
├── .claude-export/          # Утилита
│   ├── dist/
│   ├── public/
│   └── package.json
├── dialog/                  # Экспортированные диалоги
│   ├── 2025-12-05_session-abc123.md
│   └── ...
├── html-viewer/             # Статический viewer для студентов
│   └── index.html
├── .gitignore               # Диалоги добавлены сюда
└── package.json             # Добавлены npm scripts
```

---

## Требования

- **Node.js 18+** — [Установка](https://nodejs.org/)
- **Claude Code** — диалоги для экспорта

---

## Установка

### Вариант 1: Клонировать в свой проект

```bash
cd your-project
git clone https://github.com/alexeykrol/claude-export.git .claude-export
.claude-export/install.sh
```

### Вариант 2: Клонировать проект с уже установленной утилитой

```bash
git clone <repository-with-claude-export>
cd <project>
.claude-export/install.sh
```

---

## Использование

После установки доступны команды:

```bash
# Экспортировать диалоги + сгенерировать HTML viewer
npm run dialog:export

# Открыть веб-интерфейс для управления диалогами
npm run dialog:ui

# Запустить автоматический экспорт новых диалогов
npm run dialog:watch

# Показать список всех диалогов
npm run dialog:list
```

---

## Веб-интерфейс

Откройте http://localhost:3333 после запуска `npm run dialog:ui`:

- Просмотр всех экспортированных диалогов
- Переключение видимости (публичный/приватный)
- Просмотр содержимого диалогов
- Фильтрация и поиск

---

## Приватность диалогов

| Состояние | Описание |
|-----------|----------|
| **Приватный** (по умолчанию) | Файл в `.gitignore`, не попадёт в git |
| **Публичный** | Файл убран из `.gitignore`, будет в репозитории |

Переключить можно:
- Через веб-интерфейс (галочка в таблице)
- Вручную в `.gitignore`

---

## Формат диалога

```markdown
<!-- AUTHOR: Ivan Petrov <ivan@email.com> -->
<!-- SUMMARY_SHORT: Краткое описание диалога -->
<!-- SUMMARY_FULL: Полное описание с деталями -->

# Claude Code Session

**Author:** Ivan Petrov
**Project:** my-project
**Date:** 05.12.2025
**Messages:** 42

---

## Dialog

### User *(05.12.2025, 12:30)*
Привет, помоги с...

---

### Claude *(05.12.2025, 12:31)*
Конечно! Вот решение...
```

---

## Кейсы использования

### Кейс 1: Преподаватель делится диалогами со студентами

1. Установите утилиту в учебный проект
2. Ваши диалоги автоматически экспортируются
3. Сделайте нужные диалоги публичными через UI
4. Закоммитьте и запушьте
5. **Студенты открывают `html-viewer/index.html`** — без установки node.js!

```bash
# Преподаватель
.claude-export/install.sh
npm run dialog:export          # Экспорт + генерация HTML viewer
npm run dialog:ui              # Открыть UI, сделать диалоги публичными
git add -A && git commit -m "Add dialogs"
git push

# Студент
git clone <repo>
open html-viewer/index.html    # Просто открыть файл в браузере
```

### Кейс 2: Командная разработка

1. Один из разработчиков добавляет утилиту в проект
2. Каждый член команды запускает `install.sh` после клонирования
3. Диалоги каждого помечаются его именем из `git config user.name`
4. Команда может делиться полезными диалогами

```bash
# Разработчик A
.claude-export/install.sh
npm run dialog:watch &         # Автоэкспорт в фоне
# ... работает с Claude Code ...
# Делает диалог публичным через UI
git add -A && git commit && git push

# Разработчик B
git pull
npm run dialog:ui              # Видит диалоги разработчика A
```

### Кейс 3: Личное использование

Просто храните историю своих диалогов с Claude Code:

```bash
.claude-export/install.sh
npm run dialog:watch &         # Запустить в фоне
# Все диалоги автоматически сохраняются в dialog/
```

---

## Автоматическая генерация саммари

При использовании `npm run dialog:watch` утилита автоматически:
1. Экспортирует новые диалоги
2. Через 30 минут после завершения диалога генерирует двухуровневое саммари

### Двухуровневые саммари

Система генерирует **два** саммари для каждого диалога:

- **SUMMARY_SHORT** — одно предложение для списка диалогов
  Пример: "Исправлена логика чекбоксов visibility в index.html"

- **SUMMARY_FULL** — 3-5 предложений для детального просмотра
  Включает: главную задачу, что сделано, технические решения, итоговый статус

Саммари добавляются в начало файла:
```markdown
<!-- SUMMARY_SHORT: Исправлена логика чекбоксов visibility в index.html -->
<!-- SUMMARY_FULL: Задача заключалась в устранении бага с чекбоксами видимости диалогов. Добавлен атрибут checked для корректного отображения состояния. Исправлен обработчик события change для правильной работы toggle. Все диалоги теперь корректно отображают статус публичности. -->
```

### Оптимизация затрат

- Генерация использует **Claude Haiku** (в 5-10 раз дешевле Sonnet)
- Debounce **30 минут** — саммари создаётся только после длительной паузы
- Для закрытых диалогов — финальное саммари генерируется сразу

---

## CLI команды

```bash
# Через npm scripts (рекомендуется)
npm run dialog:export        # Экспорт + HTML viewer
npm run dialog:ui            # Веб-интерфейс
npm run dialog:watch         # Автоэкспорт
npm run dialog:list          # Список диалогов

# Напрямую
node .claude-export/dist/cli.js init      # Инициализация
node .claude-export/dist/cli.js ui        # Веб-интерфейс
node .claude-export/dist/cli.js watch     # Автоэкспорт
node .claude-export/dist/cli.js list      # Список
node .claude-export/dist/cli.js export    # Разовый экспорт
```

---

## Структура данных

### Основные сущности

```
Session (из ~/.claude/projects/)
  - id: string (UUID)
  - filename: string (*.jsonl)
  - projectPath: string
  - messages: Message[]
  - summaries: string[]

ExportedDialog (в dialog/)
  - filename: string (YYYY-MM-DD_session-*.md)
  - author: { name, email }
  - isPublic: boolean (через .gitignore)
  - summary: string | null
  - content: Markdown
```

### Связи

- One Project → Many Sessions
- One Session → One Exported Dialog
- Visibility контролируется через .gitignore entries

---

## Безопасность и приватность

### Принципы

- **Локальная обработка** — данные не отправляются на внешние сервера
- **Приватность по умолчанию** — все диалоги добавляются в .gitignore
- **Контроль пользователя** — явное переключение видимости

### Данные

- Всё хранится локально
- Нет телеметрии
- Нет внешних API (кроме опционального Claude CLI для саммари)

---

## Структура репозитория

```
claude-export/               # Клонируется как .claude-export/
├── src/                     # Исходники TypeScript
│   ├── cli.ts              # CLI интерфейс
│   ├── exporter.ts         # JSONL → Markdown конвертация
│   ├── server.ts           # Express сервер для UI
│   ├── watcher.ts          # File watching
│   └── gitignore.ts        # Управление .gitignore
├── dist/                    # Скомпилированный JavaScript
├── public/                  # Веб-интерфейс
├── release/                 # Дистрибутивы
│   └── install.sh          # Скрипт установки
└── README.md
```

---

## Roadmap

### MVP (Завершено)

- [x] Экспорт сессий в Markdown
- [x] Сохранение в `dialog/`
- [x] Управление через .gitignore
- [x] Watch режим для автоэкспорта
- [x] Web UI для управления
- [x] Статический HTML viewer
- [x] Author attribution
- [x] Двухуровневые саммари

### Планы

- [ ] Поиск по содержимому диалогов
- [ ] Фильтрация по дате/автору
- [ ] Экспорт в другие форматы (JSON, HTML)
- [ ] Статистика использования Claude Code

---

## FAQ

### Где хранятся оригинальные диалоги Claude Code?
В `~/.claude/projects/` в формате JSONL.

### Почему папка называется `dialog/`?
Простое, понятное название для хранения диалогов проекта.

### Как сделать все диалоги публичными сразу?
Удалите строки с `dialog/*.md` из `.gitignore`.

### Как полностью скрыть папку диалогов?
Добавьте `dialog/` в `.gitignore` (без конкретных файлов).

### Утилита отправляет данные куда-то?
Нет. Всё работает локально. Данные никуда не отправляются.

### Как студенты смотрят диалоги без установки?
Просто открывают `html-viewer/index.html` в браузере.

---

## Лицензия

MIT
