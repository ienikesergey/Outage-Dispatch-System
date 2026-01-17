#!/bin/bash

# Ensure script stops on errors
set -e

echo "========================================"
echo "   ODS Service Configuration (Systemd)  "
echo "========================================"
echo ""

# 1. Detect Paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
SERVER_DIR="$SCRIPT_DIR/server"
NPM_PATH=$(which npm)

if [ -z "$NPM_PATH" ]; then
    echo "[ERROR] npm not found!"
    exit 1
fi

echo "Working Directory: $SERVER_DIR"
echo "NPM Path: $NPM_PATH"
echo ""

# 2. Create Service File Content
SERVICE_CONTENT="[Unit]
Description=ODS Monitoring System
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$SERVER_DIR
ExecStart=$NPM_PATH start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target"

# 3. Write Service File
SERVICE_FILE="/etc/systemd/system/ods.service"
echo "Creating service file at $SERVICE_FILE..."
echo "$SERVICE_CONTENT" > "$SERVICE_FILE"

# 4. Enable and Start Service
echo "Reloading systemd daemon..."
systemctl daemon-reload

echo "Enabling ods.service..."
systemctl enable ods.service

echo "Starting ods.service..."
systemctl restart ods.service

echo ""
echo "========================================"
echo "      SERVICE INSTALLED!                "
echo "========================================"
echo "Check status:  systemctl status ods"
echo "View logs:     journalctl -u ods -f"
echo ""
