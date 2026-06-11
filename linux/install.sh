#!/usr/bin/env bash
# Install the presence agent as a systemd --user service (starts with your
# session, no terminal). Set your Upstash creds first — run the agent once
# (python3 presence_agent_linux.py) or create presence.config.json.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
PY="$(command -v python3)"
AGENT="$DIR/presence_agent_linux.py"
UNIT_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
UNIT="$UNIT_DIR/presence.service"

mkdir -p "$UNIT_DIR"
sed -e "s|__PYTHON__|$PY|" -e "s|__AGENT__|$AGENT|" "$DIR/linux/presence.service" > "$UNIT"

systemctl --user daemon-reload
systemctl --user enable --now presence.service

echo "enabled: presence.service"
echo "status:  systemctl --user status presence.service"
echo "logs:    journalctl --user -u presence.service -f"
echo "stop:    systemctl --user disable --now presence.service"
