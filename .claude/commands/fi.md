Запусти протокол завершения спринта.

Прочитай файл `.claude/COMPLETION_PROTOCOL.md` и выполни полный чеклист:

1. `npm run build` — проверка сборки
2. Обновить версии везде (найти через grep)
3. Обновить метафайлы:
   - `.claude/BACKLOG.md` — отметить выполненные задачи
   - `.claude/PROJECT_SNAPSHOT.md` — обновить дату и прогресс
   - `CHANGELOG.md` — добавить запись
   - `.claude/ARCHITECTURE.md` — если были архитектурные изменения
   - `.claude/SECURITY.md` — если были изменения безопасности
4. `npm run dialog:export` — экспорт диалогов
5. `git add -A && git commit`
6. Спросить: "Сделать git push?"
