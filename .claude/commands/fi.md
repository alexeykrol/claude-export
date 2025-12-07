Запусти протокол завершения спринта.

Выполни Completion Protocol из `CLAUDE.md`:

1. `npm run build` — проверка сборки
2. Обновить версии везде (найти через grep)
3. Обновить метафайлы:
   - `.claude/BACKLOG.md` — отметить выполненные задачи
   - `.claude/SNAPSHOT.md` — обновить дату и прогресс
   - `CHANGELOG.md` — добавить запись
   - `.claude/ARCHITECTURE.md` — если были архитектурные изменения
4. `npm run dialog:export` — экспорт диалогов
5. `git add -A && git commit`
6. Спросить: "Сделать git push?"
7. Пометить сессию как "clean" в `.claude/.last_session`
