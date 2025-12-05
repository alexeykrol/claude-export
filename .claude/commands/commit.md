---
description: Создать git commit с правильным форматом
---

Помоги создать git commit для текущих изменений.

**Процесс:**

1. **Проверь статус:**
   ```bash
   git status
   git diff
   ```

2. **Определи тип изменения:**
   - `feat:` — новая функциональность
   - `fix:` — исправление бага
   - `docs:` — документация
   - `refactor:` — рефакторинг
   - `chore:` — обслуживание

3. **Создай commit message:**
   ```
   type: Краткое описание (до 50 символов)

   - Детальное описание 1
   - Детальное описание 2

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

4. **Обнови документацию:**
   - [ ] BACKLOG.md — статус задач
   - [ ] CHANGELOG.md — запись изменения
   - [ ] PROJECT_SNAPSHOT.md — если завершена фаза

5. **Выполни commit:**
   ```bash
   git add .
   git commit -m "..."
   ```

**Примеры:**

```
feat: Add search functionality in UI

- Added search input in dialog list
- Implemented fuzzy search
- Updated API with search endpoint
```

```
fix: Correct debounce timing in watcher

- Changed from 1s to 2s debounce
- Prevents duplicate exports
```
