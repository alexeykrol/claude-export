#!/bin/bash
#
# Claude Export Installer
# Installs claude-export utility for exporting Claude Code dialogs
#
# Usage:
#   ./install.sh              # Standalone (utility only)
#   ./install.sh --framework  # With framework files (CLAUDE.md, PROCESS.md, etc.)
#

set -e

VERSION="2.3.0"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Claude Export v${VERSION} — Installer${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check for framework flag
FRAMEWORK=false
if [[ "$1" == "--framework" ]] || [[ "$1" == "-f" ]]; then
    FRAMEWORK=true
    echo -e "${GREEN}Mode: Framework (full automation)${NC}"
else
    echo -e "${GREEN}Mode: Standalone (utility only)${NC}"
fi
echo ""

# Detect archive
ARCHIVE=""
if [[ -f "${SCRIPT_DIR}/claude-export-framework.tar.gz" ]] && [[ "$FRAMEWORK" == true ]]; then
    ARCHIVE="${SCRIPT_DIR}/claude-export-framework.tar.gz"
elif [[ -f "${SCRIPT_DIR}/claude-export-standalone.tar.gz" ]]; then
    ARCHIVE="${SCRIPT_DIR}/claude-export-standalone.tar.gz"
elif [[ -f "${SCRIPT_DIR}/claude-export.tar.gz" ]]; then
    ARCHIVE="${SCRIPT_DIR}/claude-export.tar.gz"
else
    echo -e "${RED}Error: Archive not found!${NC}"
    echo "Expected: claude-export-standalone.tar.gz or claude-export-framework.tar.gz"
    exit 1
fi

echo -e "${YELLOW}Step 1:${NC} Extracting archive..."
tar -xzf "$ARCHIVE" -C .
echo "   → .claude-export/ created"

# Check if .claude/commands exists and create ui.md
if [[ "$FRAMEWORK" == true ]] || [[ -d ".claude" ]]; then
    echo ""
    echo -e "${YELLOW}Step 2:${NC} Setting up slash commands..."
    mkdir -p .claude/commands

    cat > .claude/commands/ui.md << 'EOF'
Запусти Web UI для просмотра и управления диалогами Claude Export.

Выполни команду:
```bash
npm run dialog:ui
```

После запуска:
- Открой http://localhost:3333 в браузере
- UI позволяет просматривать диалоги и управлять их видимостью
- Для остановки: Ctrl+C
EOF
    echo "   → .claude/commands/ui.md created"
fi

# Update package.json if exists
if [[ -f "package.json" ]]; then
    echo ""
    echo -e "${YELLOW}Step 3:${NC} Updating package.json..."

    # Check if scripts already exist
    if grep -q "dialog:export" package.json; then
        echo "   → Scripts already exist, skipping"
    else
        # Use node to safely update package.json
        node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['dialog:export'] = 'node .claude-export/dist/cli.js export';
pkg.scripts['dialog:ui'] = 'node .claude-export/dist/cli.js ui';
pkg.scripts['dialog:list'] = 'node .claude-export/dist/cli.js list';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"
        echo "   → Added dialog:export, dialog:ui, dialog:list scripts"
    fi
else
    echo ""
    echo -e "${YELLOW}Step 3:${NC} No package.json found, skipping script setup"
    echo "   → You can run CLI directly: node .claude-export/dist/cli.js"
fi

# Cleanup
echo ""
echo -e "${YELLOW}Step 4:${NC} Cleaning up..."
rm -f "$ARCHIVE"
rm -f "${SCRIPT_DIR}/install.sh" 2>/dev/null || true
echo "   → Installer files removed"

# Summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Installation complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Installed files:"
echo "  .claude-export/     — CLI utility"

if [[ "$FRAMEWORK" == true ]]; then
    echo "  CLAUDE.md           — AI context file"
    echo "  PROCESS.md          — Sprint completion protocol"
    echo "  .claude/commands/   — Slash commands"
fi

echo ""
echo "Available commands:"
echo "  npm run dialog:export  — Export dialogs + generate HTML"
echo "  npm run dialog:ui      — Start web UI on :3333"
echo "  npm run dialog:list    — List all sessions"
echo ""

if [[ "$FRAMEWORK" == true ]]; then
    echo "With Claude Code:"
    echo "  /ui                   — Start web UI (slash command)"
    echo "  \"Завершить спринт\"    — Full export + commit protocol"
    echo ""
fi

echo "Next: Start Claude Code and begin working!"
echo ""
