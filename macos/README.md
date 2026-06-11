# Presence on macOS — background service

Run the agent at login with no terminal, via `launchd`.

1. **Set credentials once** — either run it interactively to fill them in:
   ```bash
   pip3 install -r <(echo)   # nothing to install; stdlib only
   python3 presence_agent_macos.py        # Ctrl+C after it starts publishing
   ```
   or create `presence.config.json` (see `presence.config.example.json`), or
   export `PRESENCE_UPSTASH_URL` / `PRESENCE_UPSTASH_TOKEN`.

2. *(Optional)* enable the music row:
   ```bash
   brew install nowplaying-cli
   ```

3. **Install the service:**
   ```bash
   bash macos/install.sh
   ```

It now starts at login and restarts if it crashes. Logs go to `/tmp/presence.log`.
To stop and remove it:

```bash
launchctl unload "$HOME/Library/LaunchAgents/com.presence.agent.plist"
rm "$HOME/Library/LaunchAgents/com.presence.agent.plist"
```
