"""
presence_agent_macos.py — the macOS sibling of presence_agent.py.

Same privacy model as the Windows agent: it publishes only a COARSE activity
("coding"/"listening"/…), the app name (e.g. "Cursor"), and the current
track. It NEVER publishes window titles, filenames, or URLs.

Reads:
  - the frontmost app via AppleScript (System Events),
  - now-playing media via `nowplaying-cli` (brew install nowplaying-cli).

Stdlib only — no pip installs. nowplaying-cli is optional; without it the
card just shows activity and no music.

Setup:
    brew install nowplaying-cli              # optional, for the music row
    cp presence.config.example.json presence.config.json   # add Upstash creds
    python3 presence_agent_macos.py
  (or set PRESENCE_UPSTASH_URL / PRESENCE_UPSTASH_TOKEN in the environment)
"""

import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

# ============================ CONFIG =======================================
# Credentials come from presence_config (env vars or presence.config.json).
import presence_config

PUBLISH_EDITOR = True          # publish app name (Cursor/VS Code). NEVER filenames.
HEARTBEAT_SEC  = 60            # push at least this often even if nothing changed
POLL_SEC       = 3             # how often to read local state
# ===========================================================================

# frontmost app name -> (activity, nice app name or None)
ACTIVITY_MAP = {
    "Cursor":          ("coding", "Cursor"),
    "Code":            ("coding", "VS Code"),
    "Code - Insiders": ("coding", "VS Code"),
    "Xcode":           ("coding", "Xcode"),
    "PyCharm":         ("coding", "PyCharm"),
    "IntelliJ IDEA":   ("coding", "IntelliJ"),
    "Sublime Text":    ("coding", "Sublime"),
    "Zed":             ("coding", "Zed"),
    "iTerm2":          ("terminal", None),
    "Terminal":        ("terminal", None),
    "Warp":            ("terminal", None),
    "Alacritty":       ("terminal", None),
    "kitty":           ("terminal", None),
    "Safari":          ("browsing", None),
    "Google Chrome":   ("browsing", None),
    "Firefox":         ("browsing", None),
    "Arc":             ("browsing", None),
    "Brave Browser":   ("browsing", None),
    "Spotify":         ("listening", "Spotify"),
    "Music":           ("listening", "Music"),
    "VLC":             ("watching", "VLC"),
    "Finder":          ("desktop", None),
}

_HAS_NOWPLAYING = shutil.which("nowplaying-cli") is not None


def get_foreground():
    """Return (activity, editor). Never returns the window title."""
    try:
        name = subprocess.run(
            ["osascript", "-e",
             'tell application "System Events" to get name of first application process whose frontmost is true'],
            capture_output=True, text=True, timeout=4,
        ).stdout.strip()
        activity, editor = ACTIVITY_MAP.get(name, (name.lower(), None))
        return activity, (editor if PUBLISH_EDITOR else None)
    except Exception:
        return "idle", None


def get_media():
    """Now-playing via nowplaying-cli, or None."""
    if not _HAS_NOWPLAYING:
        return None
    try:
        out = subprocess.run(
            ["nowplaying-cli", "get", "title", "artist", "playbackRate"],
            capture_output=True, text=True, timeout=4,
        ).stdout.splitlines()
        title = (out[0] if len(out) > 0 else "").strip()
        if not title or title == "null":
            return None
        artist = (out[1] if len(out) > 1 else "").strip()
        rate = (out[2] if len(out) > 2 else "0").strip()
        return {
            "title": title,
            "artist": "" if artist == "null" else artist.removesuffix(" - Topic"),
            "playing": rate not in ("0", "0.0", "null", ""),
            "app": "media",
        }
    except Exception:
        return None


def push_upstash(value: str):
    c = presence_config.get()
    url, token = c.get("upstash_url"), c.get("upstash_token")
    if not (url and token):
        return
    try:
        req = urllib.request.Request(
            f"{url.rstrip('/')}/set/presence",
            data=value.encode("utf-8"),
            headers={"Authorization": f"Bearer {token}"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=8).read()
    except Exception as e:
        print("\n[upstash] push failed:", e)


def push_cloud(value: str):
    c = presence_config.get()
    key, base = c.get("api_key"), c.get("api_base")
    if not key:
        return
    try:
        req = urllib.request.Request(
            f"{base.rstrip('/')}/api/ingest",
            data=value.encode("utf-8"),
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=8).read()
    except Exception as e:
        print("\n[cloud] push failed:", e)


def publish(value: str):
    if presence_config.creds_mode() == "cloud":
        push_cloud(value)
    else:
        push_upstash(value)


def fingerprint(p):
    return json.dumps({k: p[k] for k in ("activity", "editor", "media")}, ensure_ascii=False)


def main():
    if not presence_config.has_creds():
        print("no Upstash creds — set PRESENCE_UPSTASH_URL/TOKEN or fill presence.config.json")
    if not _HAS_NOWPLAYING:
        print("note: nowplaying-cli not found — music row disabled (brew install nowplaying-cli)")
    print("publishing presence  |  Ctrl+C to stop\n")

    last_fp, last_push = None, 0.0
    while True:
        media = get_media()
        activity, editor = get_foreground()
        payload = {"activity": activity, "editor": editor, "media": media, "ts": int(time.time())}

        fp, now = fingerprint(payload), time.time()
        if fp != last_fp or (now - last_push) >= HEARTBEAT_SEC:
            publish(json.dumps(payload, ensure_ascii=False))
            last_fp, last_push, flag = fp, now, "PUSH"
        else:
            flag = "    "

        line = f"[{flag}] {activity}" + (f" — {editor}" if editor else "")
        if media:
            state = "▶" if media["playing"] else "⏸"
            artist = f" — {media['artist']}" if media["artist"] else ""
            line += f"  |  {state} {media['title']}{artist}"
        print("\r" + line.ljust(110), end="", flush=True)

        time.sleep(POLL_SEC)


if __name__ == "__main__":
    if presence_config.setup_from_cli(sys.argv):
        sys.exit(0)
    try:
        main()
    except KeyboardInterrupt:
        print("\nbye")
