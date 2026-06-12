"""
presence_agent.py  (v2)  —  detects + publishes your "now playing / now coding".

Reads the Windows media session (Spotify desktop, YouTube in any browser, VLC...
all through ONE interface) plus the focused app, then publishes a small, PRIVACY-
SAFE status to the cloud so the public card can show it.

  - PUBLISHES: coarse activity ("coding"/"browsing"/...), the app name (e.g.
    "Cursor"), and the current track. It NEVER publishes window titles or
    filenames (your "AiVisionResultService.java - SuCre" stays on your machine).
  - Pushes to Upstash and/or a GitHub gist — fill whichever backend you want.
  - Only pushes when something CHANGES (plus a heartbeat), so you stay far under
    any free-tier limits.

Setup:
    pip install winsdk pywin32 psutil requests
    # fill the CONFIG block below, then:
    python presence_agent.py
"""

import asyncio
import json
import os
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import psutil
import requests
import win32gui
import win32process
from winsdk.windows.media.control import (
    GlobalSystemMediaTransportControlsSessionManager as MediaManager,
    GlobalSystemMediaTransportControlsSessionPlaybackStatus as PlaybackStatus,
)

# ============================ CONFIG =======================================
# Credentials are loaded by presence_config (env vars or presence.config.json,
# never committed). First run with no creds pops a setup dialog.
import presence_config

PUBLISH_EDITOR = True          # publish app name (Cursor/VS Code). NEVER filenames.
SERVE_LOCAL    = True          # also expose http://127.0.0.1:8787/status for testing
HEARTBEAT_SEC  = 60            # push at least this often even if nothing changed
POLL_SEC       = 3             # how often to read local state
# ===========================================================================

_status = {"activity": "starting…", "editor": None, "media": None, "ts": 0}
_lock = threading.Lock()

# process name -> (activity, nice app name or None)
ACTIVITY_MAP = {
    "cursor.exe":        ("coding", "Cursor"),
    "code.exe":          ("coding", "VS Code"),
    "devenv.exe":        ("coding", "Visual Studio"),
    "pycharm64.exe":     ("coding", "PyCharm"),
    "idea64.exe":        ("coding", "IntelliJ"),
    "sublime_text.exe":  ("coding", "Sublime"),
    "windowsterminal.exe": ("terminal", None),
    "wt.exe":            ("terminal", None),
    "powershell.exe":    ("terminal", None),
    "cmd.exe":           ("terminal", None),
    "chrome.exe":        ("browsing", None),
    "msedge.exe":        ("browsing", None),
    "firefox.exe":       ("browsing", None),
    "brave.exe":         ("browsing", None),
    "opera.exe":         ("browsing", None),
    "spotify.exe":       ("listening", "Spotify"),
    "vlc.exe":           ("watching", "VLC"),
    "explorer.exe":      ("desktop", None),
    "zen.exe": ("browsing", None),
}


def get_foreground():
    """Return (activity, editor, window_title_local_only)."""
    try:
        hwnd = win32gui.GetForegroundWindow()
        title = win32gui.GetWindowText(hwnd)               # local-only, never published
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        proc = psutil.Process(pid).name().lower()
        activity, editor = ACTIVITY_MAP.get(proc, (proc.replace(".exe", ""), None))
        return activity, (editor if PUBLISH_EDITOR else None), title
    except Exception:
        return "idle", None, ""


def media_app_label(app_id: str) -> str:
    a = (app_id or "").lower()
    if "spotify" in a:
        return "Spotify"
    if any(b in a for b in ("chrome", "msedge", "edge", "firefox", "brave", "opera")):
        return "Browser"
    # browser media often reports a hex AUMID like "F0DC299D809B9700"
    if a and all(c in "0123456789abcdef" for c in a) and len(a) >= 12:
        return "Browser"
    return "media"


async def get_media():
    try:
        mgr = await MediaManager.request_async()
        session = mgr.get_current_session()
        if session is None:
            return None
        info = await session.try_get_media_properties_async()
        title = (info.title or "").strip()
        if not title:
            return None
        return {
            "title": title,
            "artist": (info.artist or "").strip().removesuffix(" - Topic"),
            "playing": session.get_playback_info().playback_status == PlaybackStatus.PLAYING,
            "app": media_app_label(session.source_app_user_model_id or ""),
        }
    except Exception:
        return None


# ---- publishing -----------------------------------------------------------
def push_upstash(value: str):
    c = presence_config.get()
    url, token = c.get("upstash_url"), c.get("upstash_token")
    if not (url and token):
        return
    try:
        requests.post(
            f"{url.rstrip('/')}/set/presence",
            headers={"Authorization": f"Bearer {token}"},
            data=value.encode("utf-8"),
            timeout=8,
        )
    except Exception as e:
        print("\n[upstash] push failed:", e)


def push_gist(value: str):
    c = presence_config.get()
    gid, gtok = c.get("gist_id"), c.get("gist_token")
    if not (gid and gtok):
        return
    try:
        requests.patch(
            f"https://api.github.com/gists/{gid}",
            headers={
                "Authorization": f"Bearer {gtok}",
                "Accept": "application/vnd.github+json",
            },
            json={"files": {c.get("gist_filename", "status.json"): {"content": value}}},
            timeout=8,
        )
    except Exception as e:
        print("\n[gist] push failed:", e)


def push_cloud(value: str):
    c = presence_config.get()
    key, base = c.get("api_key"), c.get("api_base")
    if not key:
        return
    try:
        requests.post(
            f"{base.rstrip('/')}/api/ingest",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            data=value.encode("utf-8"),
            timeout=8,
        )
    except Exception as e:
        print("\n[cloud] push failed:", e)


def publish(payload: dict):
    value = json.dumps(payload, ensure_ascii=False)
    if presence_config.creds_mode() == "cloud":
        push_cloud(value)
    else:
        push_upstash(value)
        push_gist(value)


# ---- local test endpoint --------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.rstrip("/") in ("/status", ""):
            with _lock:
                body = json.dumps(_status, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, *a):
        pass


def serve():
    HTTPServer(("127.0.0.1", 8787), Handler).serve_forever()


# ---- main loop ------------------------------------------------------------
def fingerprint(p):
    """What we compare to decide if a push is needed (everything but ts)."""
    return json.dumps({k: p[k] for k in ("activity", "editor", "media")}, ensure_ascii=False)


async def main():
    presence_config.ensure_interactive()      # first-run: prompt for creds
    if SERVE_LOCAL:
        threading.Thread(target=serve, daemon=True).start()
        print("local test endpoint: http://127.0.0.1:8787/status")
    c = presence_config.get()
    targets = []
    if c.get("upstash_url"): targets.append("upstash")
    if c.get("gist_id"): targets.append("gist")
    print("publishing to:", ", ".join(targets) or "(none — fill presence.config.json)", " | Ctrl+C to stop\n")

    last_fp = None
    last_push = 0.0

    while True:
        media = await get_media()
        activity, editor, win_title = get_foreground()
        payload = {"activity": activity, "editor": editor, "media": media, "ts": int(time.time())}

        with _lock:
            _status.update(payload)

        fp = fingerprint(payload)
        now = time.time()
        if fp != last_fp or (now - last_push) >= HEARTBEAT_SEC:
            publish(payload)
            last_fp = fp
            last_push = now
            flag = "PUSH"
        else:
            flag = "    "

        # local console (this CAN show the window title — it's not published)
        line = f"[{flag}] {activity}" + (f" — {editor}" if editor else "")
        if media:
            state = "▶" if media["playing"] else "⏸"
            artist = f" — {media['artist']}" if media["artist"] else ""
            line += f"  |  {state} {media['app']}: {media['title']}{artist}"
        print("\r" + line.ljust(110), end="", flush=True)

        await asyncio.sleep(POLL_SEC)


if __name__ == "__main__":
    if presence_config.setup_from_cli(sys.argv):
        sys.exit(0)
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nbye")
