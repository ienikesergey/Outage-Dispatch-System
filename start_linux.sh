#!/bin/bash

echo "================================"
echo "   Starting Monitoring Server   "
echo "================================"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

cd "$SCRIPT_DIR/server"
npm start
