#!/bin/bash

# Ensure script stops on errors
set -e

echo "========================================"
echo "   ODS System Installation (Linux)      "
echo "========================================"
echo ""

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js v18 or higher."
    echo ""
    echo "For Alt Linux, try:"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install nodejs npm"
    echo ""
    exit 1
fi

NODE_VERSION=$(node -v)
echo "[OK] Node.js found: $NODE_VERSION"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# 2. Server Dependencies
echo "[1/4] Installing Server Dependencies..."
cd "$SCRIPT_DIR/server"
npm install --legacy-peer-deps

# Fix permissions for binaries (critical when copying from Windows)
echo "Fixing permissions for server binaries..."
if [ -d "node_modules/.bin" ]; then
    chmod -R +x node_modules/.bin
fi

echo "[OK] Server dependencies installed."
echo ""

# 3. Prisma Generate
echo "[2/4] Generating Prisma Client..."
npx prisma generate
echo "[OK] Prisma client generated."
echo ""

# 4. Client Dependencies & Build
echo "[3/4] Installing Client Dependencies..."
cd "$SCRIPT_DIR/client"
npm install --legacy-peer-deps

# Fix permissions for client binaries
echo "Fixing permissions for client binaries..."
if [ -d "node_modules/.bin" ]; then
    chmod -R +x node_modules/.bin
fi

echo "[3/4] Building Client..."
npm run build
echo "[OK] Client built."
echo ""

# 5. Database Setup
echo "[4/4] Setting up Database..."
cd "$SCRIPT_DIR/server"
if [ ! -f "dev.db" ]; then
    echo "Initializing database..."
    npx prisma db push --accept-data-loss
    npm run seed
    echo "[OK] Database created."
else
    echo "[OK] Database already exists."
fi

echo ""
echo "========================================"
echo "      INSTALLATION COMPLETE!            "
echo "========================================"
echo "To start the server, run:"
echo "  bash start_linux.sh"
echo ""
