#!/bin/bash
#
# Claude Export - Installation Script
# Run this from the .claude-export/ folder inside your project
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory (should be .claude-export/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Claude Export - Installer${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Check for Node.js
echo -e "${YELLOW}Step 1: Checking requirements...${NC}"
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
echo -e "  ${GREEN}✓${NC} npm $(npm -v)"

# Step 2: Install dependencies
echo ""
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
echo ""

cd "$SCRIPT_DIR"
npm install --silent 2>/dev/null || npm install
echo -e "  ${GREEN}✓${NC} Dependencies installed"

# Step 3: Run initialization
echo ""
echo -e "${YELLOW}Step 3: Initializing Claude Export...${NC}"
echo ""

node "$SCRIPT_DIR/dist/cli.js" init "$PROJECT_DIR"

# Step 4: Add npm scripts to project's package.json (if exists)
if [ -f "$PROJECT_DIR/package.json" ]; then
    echo ""
    echo -e "${YELLOW}Step 4: Adding npm scripts...${NC}"
    echo ""

    # Check if scripts already exist
    if ! grep -q '"dialog:' "$PROJECT_DIR/package.json"; then
        # Use node to safely modify package.json
        node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('$PROJECT_DIR/package.json', 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts['dialog:watch'] = 'node .claude-export/dist/cli.js watch';
pkg.scripts['dialog:ui'] = 'node .claude-export/dist/cli.js ui';
pkg.scripts['dialog:list'] = 'node .claude-export/dist/cli.js list';
fs.writeFileSync('$PROJECT_DIR/package.json', JSON.stringify(pkg, null, 2) + '\n');
"
        echo -e "  ${GREEN}✓${NC} Added scripts to package.json:"
        echo "      npm run dialog:watch"
        echo "      npm run dialog:ui"
        echo "      npm run dialog:list"
    else
        echo -e "  ${GREEN}✓${NC} Scripts already exist in package.json"
    fi
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Installation Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Usage:"
echo ""
echo "  View dialogs in UI:"
echo "    npm run dialog:ui"
echo ""
echo "  Start auto-export watcher:"
echo "    npm run dialog:watch"
echo ""
echo "  List all dialogs:"
echo "    npm run dialog:list"
echo ""
