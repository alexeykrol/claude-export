# Development Workflow

**Project:** Claude Export
**Purpose:** Development processes and practices
**Last Updated:** 2025-12-05

---

## 🎯 Development Philosophy

### Core Principles

1. **Simplicity first** — Минимум зависимостей, максимум пользы
2. **Documentation as code** — Документация обновляется вместе с кодом
3. **Test before commit** — Проверка в dev environment
4. **Privacy by design** — Безопасность на каждом этапе

---

## 🔄 Development Cycle

```
1. PLANNING
   ├── Read BACKLOG.md
   ├── Identify task
   └── Create TodoWrite list

2. IMPLEMENTATION
   ├── Follow existing patterns
   ├── Keep modules small
   └── Update types

3. TESTING
   ├── npm run build
   ├── Manual testing
   └── Check edge cases

4. DOCUMENTATION
   ├── Update BACKLOG.md
   ├── Update relevant docs
   └── Add to CHANGELOG.md

5. COMMIT
   └── Git commit with template
```

---

## 📦 Build & Run

### Development
```bash
# Run directly with ts-node
npm run dev            # ts-node src/cli.ts

# Watch mode during development
npm run watch          # ts-node src/cli.ts watch
```

### Production Build
```bash
# Compile TypeScript
npm run build          # tsc

# Run compiled version
npm start              # node dist/cli.js
```

### Testing Commands
```bash
# In target project after install:
npm run dialog:ui      # Web interface
npm run dialog:watch   # Auto-export
npm run dialog:list    # List sessions
```

---

## 📝 Git Workflow

### Branch Strategy

```
main
  └── feature/[name]     # New features
  └── fix/[name]         # Bug fixes
  └── docs/[name]        # Documentation
```

### Commit Message Template

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

## 📋 Sprint Completion Checklist

### Code Quality
- [ ] TypeScript compiles without errors
- [ ] No console errors in runtime
- [ ] Edge cases handled

### Documentation
- [ ] BACKLOG.md updated
- [ ] PROJECT_SNAPSHOT.md updated
- [ ] CHANGELOG.md entry added
- [ ] README.md updated (if user-facing)

### Git
- [ ] Meaningful commit message
- [ ] All files staged
- [ ] Branch merged to main

---

## 🔧 Module Development

### Adding New Module

1. Create `src/module-name.ts`
2. Define types/interfaces
3. Implement functions
4. Export in index (if needed)
5. Add to CLI if command
6. Document in ARCHITECTURE.md

### Module Template

```typescript
/**
 * Module Name - Brief description
 */

import * as fs from 'fs';
import * as path from 'path';

// Types
export interface ModuleInput {
  // ...
}

export interface ModuleOutput {
  // ...
}

// Implementation
export function mainFunction(input: ModuleInput): ModuleOutput {
  // ...
}
```

---

## 🧪 Testing Approach

### Manual Testing Checklist

**For Export:**
- [ ] Exports new session correctly
- [ ] Handles empty session
- [ ] Handles large session (1000+ messages)
- [ ] Creates .dialog/ if not exists
- [ ] Adds to .gitignore

**For Watch:**
- [ ] Detects new files
- [ ] Debounce works (no duplicate exports)
- [ ] Summary generation triggers

**For UI:**
- [ ] Lists all dialogs
- [ ] Toggle visibility works
- [ ] Dialog content displays
- [ ] Search works

---

## 🚀 Release Process

### Version Numbering

- **Patch (2.1.x):** Bug fixes
- **Minor (2.x.0):** New features
- **Major (x.0.0):** Breaking changes

### Release Checklist

1. [ ] All features tested
2. [ ] Documentation updated
3. [ ] CHANGELOG.md entry
4. [ ] Version in package.json
5. [ ] `npm run build` succeeds
6. [ ] Git tag created

### Release Commands

```bash
# Update version
npm version patch  # or minor, major

# Build
npm run build

# Tag and push
git push --tags
```

---

## 📚 Documentation Standards

### File Updates

| Event | Update |
|-------|--------|
| New feature | BACKLOG, CHANGELOG, possibly README |
| Bug fix | BACKLOG, CHANGELOG |
| Architecture change | ARCHITECTURE |
| Security change | SECURITY |
| New pattern | ARCHITECTURE |

### Documentation Order

1. **BACKLOG.md** — Mark tasks done
2. **PROJECT_SNAPSHOT.md** — Update status
3. **CHANGELOG.md** — Add entry
4. **Other docs** — As needed

---

## 🛠️ Common Tasks

### Add New CLI Command

1. Add to `cli.ts` switch statement
2. Implement handler function
3. Add to help text
4. Document in README.md

### Add New API Endpoint

1. Add route in `server.ts`
2. Implement handler
3. Add types if needed
4. Test manually

### Modify Export Format

1. Update `toMarkdown()` in `exporter.ts`
2. Test with various sessions
3. Update documentation

---

## ⚠️ Common Issues

### Build Errors

```bash
# Clean rebuild
rm -rf dist/
npm run build
```

### Type Errors

```bash
# Check types
npx tsc --noEmit
```

### Watch Not Working

- Check Claude sessions exist
- Verify project path correct
- Check file permissions

---

*Workflow ensures consistent, quality development*
*Last updated: 2025-12-05*
