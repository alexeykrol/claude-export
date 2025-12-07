# PROCESS.md — Development & Sprint Protocol

> Unified development workflow and sprint completion process

---

## 🎯 Development Principles

1. **Simplicity first** — Минимум зависимостей, максимум пользы
2. **Documentation as code** — Документация обновляется вместе с кодом
3. **Privacy by design** — Безопасность на каждом этапе

---

## 📦 Build & Run

### Development
```bash
npm run build          # Compile TypeScript
npm run dev            # Run with ts-node
```

### Target Project Commands
```bash
npm run dialog:export  # Export dialogs + generate HTML
npm run dialog:ui      # Web interface on :3333
npm run dialog:list    # List sessions
```

---

## 🔄 Sprint Completion Protocol

### Чеклист (выполняется после завершения задачи):

1. **Экспорт диалогов**
   - [ ] `npm run dialog:export`
   - [ ] Проверить `html-viewer/index.html` (опционально)

2. **Обновить BACKLOG.md**
   - [ ] Отметить выполненные задачи (`[x]`)
   - [ ] Добавить новые задачи если появились

3. **Обновить PROJECT_SNAPSHOT.md**
   - [ ] Обновить дату и статус модулей
   - [ ] Обновить "Общий прогресс"

4. **Обновить CHANGELOG.md**
   - [ ] Добавить запись для изменения

5. **Git commit & push**
   - [ ] Использовать шаблон коммита
   - [ ] `git push`

---

## 📝 Git Commit Template

```bash
git commit -m "$(cat <<'EOF'
type: Brief description

- Detail 1
- Detail 2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Types:**
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `refactor:` — Code refactoring
- `chore:` — Maintenance

---

## 🎯 Критерии завершения задачи

Задача считается завершенной когда:

1. ✅ Код компилируется без ошибок (`npm run build`)
2. ✅ Функциональность протестирована
3. ✅ Диалоги экспортированы
4. ✅ Метафайлы обновлены
5. ✅ Коммит создан и запушен

---

## 🚀 Release Process

### Version Numbering
- **Patch (2.1.x):** Bug fixes
- **Minor (2.x.0):** New features
- **Major (x.0.0):** Breaking changes

### Release Commands
```bash
npm version patch  # or minor, major
npm run build
git push --tags
```

---

## ⚠️ Common Issues

### Build Errors
```bash
rm -rf dist/
npm run build
```

### Type Errors
```bash
npx tsc --noEmit
```

---

## 📋 AI Reminder

После завершения задачи:
```
⚠️ Задача завершена!
📋 Выполнить:
   1. npm run dialog:export
   2. BACKLOG.md
   3. PROJECT_SNAPSHOT.md
   4. CHANGELOG.md
   5. git commit & push
```

---

*Unified workflow for claude-export development*
