#!/bin/bash
#
# Claude Export Installer
# Installs claude-export utility for exporting Claude Code dialogs
#
# Usage:
#   ./install.sh              # Standalone (utility only)
#   ./install.sh --framework  # With AI framework files (.claude/)
#

set -e

VERSION="2.3.0"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Claude Export v${VERSION} — Installer${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check for framework flag
FRAMEWORK=false
if [[ "$1" == "--framework" ]] || [[ "$1" == "-f" ]]; then
    FRAMEWORK=true
    echo -e "${GREEN}Mode: Framework (with AI context files)${NC}"
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

# Framework mode: copy AI context files
if [[ "$FRAMEWORK" == true ]]; then
    echo ""
    echo -e "${YELLOW}Step 2:${NC} Setting up AI framework..."
    mkdir -p .claude/commands

    # Copy CLAUDE.md to root (auto-loaded by Claude Code)
    if [[ -f ".claude-export/framework/CLAUDE.md" ]]; then
        cp .claude-export/framework/CLAUDE.md ./CLAUDE.md
        echo "   → CLAUDE.md created (AI instructions)"
    fi

    # Copy slash commands
    if [[ -d ".claude-export/framework/commands" ]]; then
        cp -r .claude-export/framework/commands/* .claude/commands/
        echo "   → .claude/commands/ created (slash commands)"
    fi

    # Create session marker
    echo '{"status": "clean", "timestamp": "'$(date -Iseconds)'"}' > .claude/.last_session
    echo "   → .claude/.last_session created"
fi

# Update package.json if exists
if [[ -f "package.json" ]]; then
    echo ""
    echo -e "${YELLOW}Step 3:${NC} Updating package.json..."

    if grep -q "dialog:export" package.json; then
        echo "   → Scripts already exist, skipping"
    else
        node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['dialog:export'] = 'node .claude-export/dist/cli.js export';
pkg.scripts['dialog:ui'] = 'node .claude-export/dist/cli.js ui';
pkg.scripts['dialog:watch'] = 'node .claude-export/dist/cli.js watch';
pkg.scripts['dialog:list'] = 'node .claude-export/dist/cli.js list';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"
        echo "   → Added dialog:* scripts"
    fi
else
    echo ""
    echo -e "${YELLOW}Step 3:${NC} No package.json found"
    echo "   → Run CLI directly: node .claude-export/dist/cli.js"
fi

# Cleanup
echo ""
echo -e "${YELLOW}Step 4:${NC} Cleaning up..."
rm -rf .claude-export/framework 2>/dev/null || true
rm -f "$ARCHIVE"
rm -f "${SCRIPT_DIR}/install.sh" 2>/dev/null || true
echo "   → Installer files removed"

# Summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Installation complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Installed:"
echo "  .claude-export/     — CLI utility"

if [[ "$FRAMEWORK" == true ]]; then
    echo "  CLAUDE.md           — AI instructions (auto-loaded)"
    echo "  .claude/commands/   — Slash commands"
fi

echo ""
echo "Commands:"
echo "  npm run dialog:export  — Export dialogs + HTML viewer"
echo "  npm run dialog:ui      — Web UI on :3333"
echo "  npm run dialog:watch   — Auto-export on changes"
echo "  npm run dialog:list    — List sessions"
echo ""

if [[ "$FRAMEWORK" == true ]]; then
    echo "With Claude Code:"
    echo "  /ui      — Start web UI"
    echo "  /fi      — Sprint completion protocol"
    echo ""
fi

echo "Ready! Start Claude Code and begin working."
echo ""
