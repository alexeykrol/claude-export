---
description: Провести security audit проекта
---

Проведи security audit проекта claude-export.

**Чеклист безопасности:**

1. **Privacy by Default:**
   - [ ] Все диалоги добавляются в .gitignore
   - [ ] Публикация требует явного действия
   - [ ] UI показывает статус видимости

2. **Локальная обработка:**
   - [ ] Нет внешних API вызовов (кроме Claude CLI)
   - [ ] Нет телеметрии
   - [ ] Данные не покидают машину

3. **Файловая система:**
   - [ ] Чтение только ~/.claude/projects/
   - [ ] Запись только в .dialog/
   - [ ] Нет arbitrary file access

4. **Сеть:**
   - [ ] Сервер только на localhost
   - [ ] Нет public exposure
   - [ ] Порт можно настроить

5. **Код:**
   - [ ] Нет eval() или подобного
   - [ ] Нет shell injection
   - [ ] Пути валидируются

**Файлы для проверки:**

1. `src/exporter.ts` — работа с файлами
2. `src/server.ts` — веб-сервер
3. `src/watcher.ts` — file watching
4. `src/gitignore.ts` — .gitignore manipulation

**Формат ответа:**

- ✅ Security requirements met
- ⚠️ Потенциальные улучшения
- ❌ Критические проблемы (требуют исправления)

**Референс:** См. SECURITY.md для полных требований
