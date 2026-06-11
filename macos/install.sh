#!/usr/bin/env bash
# Install the presence agent as a launchd background service (starts at login,
# no terminal). Set your Upstash creds first — run the agent once
# (python3 presence_agent_macos.py) or create presence.config.json.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
PY="$(command -v python3)"
AGENT="$DIR/presence_agent_macos.py"
LABEL="com.presence.agent"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

mkdir -p "$HOME/Library/LaunchAgents"
sed -e "s|__PYTHON__|$PY|" -e "s|__AGENT__|$AGENT|" "$DIR/macos/$LABEL.plist" > "$PLIST"

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

echo "loaded: $PLIST"
echo "logs:   tail -f /tmp/presence.log"
echo "stop:   launchctl unload \"$PLIST\" && rm \"$PLIST\""
