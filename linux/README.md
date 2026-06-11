# Presence on Linux — background service

Run the agent with your session, no terminal, via `systemd --user`.

1. **Install tools** (your distro's package names may vary):
   ```bash
   sudo apt install playerctl xdotool        # media + active window (X11)
   ```
   On Sway/Hyprland the active window is read via `swaymsg`/`hyprctl` instead.

2. **Set credentials once** — run it interactively:
   ```bash
   python3 presence_agent_linux.py           # Ctrl+C after it starts publishing
   ```
   or create `presence.config.json` (see `presence.config.example.json`), or
   export `PRESENCE_UPSTASH_URL` / `PRESENCE_UPSTASH_TOKEN`.

3. **Install the service:**
   ```bash
   bash linux/install.sh
   ```

It now starts with your session and restarts on failure.

```bash
systemctl --user status presence.service     # check
journalctl --user -u presence.service -f      # logs
systemctl --user disable --now presence.service   # stop & remove
```

> Want it running even when you're not logged in? `sudo loginctl enable-linger $USER`.
