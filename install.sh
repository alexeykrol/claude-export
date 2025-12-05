#!/bin/bash
#
# Claude Export - Installation Script
# Exports Claude Code dialogs to your project's .dialog/ folder
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Claude Export - Installer${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Check for Node.js
echo -e "${YELLOW}Checking requirements...${NC}"
echo ""

if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found!${NC}"
    echo ""
    echo "Claude Export requires Node.js 18 or higher."
    echo ""
    echo "Install Node.js:"
    echo ""
    echo "  macOS (Homebrew):"
    echo "    brew install node"
    echo ""
    echo "  macOS/Linux (nvm):"
    echo "    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "    nvm install 20"
    echo ""
    echo "  Windows:"
    echo "    https://nodejs.org/en/download/"
    echo ""
    echo "After installing Node.js, run this script again."
    echo ""
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js version too old!${NC}"
    echo ""
    echo "Found: $(node -v)"
    echo "Required: v18.0.0 or higher"
    echo ""
    echo "Please upgrade Node.js and run this script again."
    exit 1
fi

echo -e "  ${GREEN}✓${NC} Node.js $(node -v)"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm not found!${NC}"
    echo "Please install npm and run this script again."
    exit 1
fi

echo -e "  ${GREEN}✓${NC} npm $(npm -v)"

# Check for Claude Code sessions
CLAUDE_DIR="$HOME/.claude/projects"
if [ -d "$CLAUDE_DIR" ]; then
    SESSION_COUNT=$(find "$CLAUDE_DIR" -name "*.jsonl" 2>/dev/null | wc -l | tr -d ' ')
    echo -e "  ${GREEN}✓${NC} Claude Code sessions found: $SESSION_COUNT"
else
    echo -e "  ${YELLOW}!${NC} No Claude Code sessions found yet"
    echo "    (Sessions will be exported when you use Claude Code)"
fi

echo ""

# Step 2: Get project path
PROJECT_PATH="${1:-$(pwd)}"
echo -e "${YELLOW}Project: ${NC}$PROJECT_PATH"
echo ""

# Step 3: Run initialization
echo -e "${YELLOW}Initializing Claude Export...${NC}"
echo ""

# Check if running from local source (development)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/dist/cli.js" ]; then
    # Local development mode
    node "$SCRIPT_DIR/dist/cli.js" init "$PROJECT_PATH"
elif command -v claude-export &> /dev/null; then
    # Globally installed
    claude-export init "$PROJECT_PATH"
else
    # Use npx (downloads from npm)
    npx claude-export init "$PROJECT_PATH"
fi

echo ""
echo -e "${GREEN}Installation complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  Start the watcher (auto-export new dialogs):"
echo "    claude-export watch"
echo ""
echo "  Or open the UI:"
echo "    claude-export ui"
echo ""
