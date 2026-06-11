"""
presence_agent_linux.py — the Linux sibling of the Windows/macOS agents.

Same privacy model: publishes only a COARSE activity ("coding"/"listening"/…),
the app name (e.g. "Cursor"), and the current track. NEVER window titles,
filenames, or URLs.

Reads:
  - now-playing media via `playerctl` (MPRIS) — apt/dnf/pacman install playerctl,
  - the active window's app class. Works on X11 (xdotool), Sway (swaymsg),
    and Hyprland (hyprctl). Other Wayland compositors fall back to media-only.

Stdlib only — no pip installs. Both CLIs are optional; the agent degrades
gracefully if either is missing.

Setup:
    sudo apt install playerctl xdotool          # or your distro's equivalent
    cp presence.config.example.json presence.config.json   # add Upstash creds
    python3 presence_agent_linux.py
  (or set PRESENCE_UPSTASH_URL / PRESENCE_UPSTASH_TOKEN in the environment)
"""

import json
import os
import shutil
import subprocess
import time
import urllib.request
from pathlib import Path

# ============================ CONFIG =======================================
# Credentials come from presence_config (env vars or presence.config.json).
import presence_config

PUBLISH_EDITOR = True
HEARTBEAT_SEC  = 60
POLL_SEC       = 3
# ===========================================================================

# window class (lowercased) substring -> (activity, nice app name or None)
ACTIVITY_MAP = [
    ("cursor",        ("coding", "Cursor")),
    ("code",          ("coding", "VS Code")),
    ("codium",        ("coding", "VSCodium")),
    ("jetbrains-pycharm", ("coding", "PyCharm")),
    ("jetbrains-idea",    ("coding", "IntelliJ")),
    ("sublime_text",  ("coding", "Sublime")),
    ("zed",           ("coding", "Zed")),
    ("nvim",          ("coding", "Neovim")),
    ("alacritty",     ("terminal", None)),
    ("kitty",         ("terminal", None)),
    ("wezterm",       ("terminal", None)),
    ("gnome-terminal", ("terminal", None)),
    ("konsole",       ("terminal", None)),
    ("foot",          ("terminal", None)),
    ("firefox",       ("browsing", None)),
    ("chrome",        ("browsing", None)),
    ("chromium",      ("browsing", None)),
    ("brave",         ("browsing", None)),
    ("librewolf",     ("browsing", None)),
    ("spotify",       ("listening", "Spotify")),
    ("vlc",           ("watching", "VLC")),
    ("mpv",           ("watching", "mpv")),
]


def _run(cmd, timeout=4):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout).stdout.strip()
    except Exception:
        return ""


def _active_class():
    """Best-effort active window class across X11 / Sway / Hyprland."""
    # Hyprland
    if os.environ.get("HYPRLAND_INSTANCE_SIGNATURE") and shutil.which("hyprctl"):
        out = _run(["hyprctl", "activewindow", "-j"])
        try:
            return (json.loads(out).get("class") or "").lower()
        except Exception:
            pass
    # Sway
    if os.environ.get("SWAYSOCK") and shutil.which("swaymsg"):
        out = _run(["swaymsg", "-t", "get_tree"])
        try:
            def find_focused(node):
                if node.get("focused"):
                    return node
                for child in node.get("nodes", []) + node.get("floating_nodes", []):
                    hit = find_focused(child)
                    if hit:
                        return hit
                return None
            n = find_focused(json.loads(out)) or {}
            return (n.get("app_id") or n.get("window_properties", {}).get("class") or "").lower()
        except Exception:
            pass
    # X11
    if shutil.which("xdotool"):
        return _run(["xdotool", "getactivewindow", "getwindowclassname"]).lower()
    return ""


def get_foreground():
    """Return (activity, editor). Never returns the window title."""
    cls = _active_class()
    if not cls:
        return "idle", None
    for needle, (activity, editor) in ACTIVITY_MAP:
        if needle in cls:
            return activity, (editor if PUBLISH_EDITOR else None)
    return cls, None


def get_media():
    """Now-playing via playerctl, or None."""
    if not shutil.which("playerctl"):
        return None
    out = _run(["playerctl", "metadata", "--format",
                "{{title}}\t{{artist}}\t{{status}}\t{{playerName}}"])
    if not out:
        return None
    parts = out.split("\t")
    title = parts[0].strip() if len(parts) > 0 else ""
    if not title:
        return None
    artist = parts[1].strip() if len(parts) > 1 else ""
    status = parts[2].strip().lower() if len(parts) > 2 else ""
    player = parts[3].strip() if len(parts) > 3 else ""
    return {
        "title": title,
        "artist": artist.removesuffix(" - Topic"),
        "playing": status == "playing",
        "app": "Spotify" if "spotify" in player.lower() else (player.capitalize() or "media"),
    }


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


def fingerprint(p):
    return json.dumps({k: p[k] for k in ("activity", "editor", "media")}, ensure_ascii=False)


def main():
    if not presence_config.has_creds():
        print("no Upstash creds — set PRESENCE_UPSTASH_URL/TOKEN or fill presence.config.json")
    if not shutil.which("playerctl"):
        print("note: playerctl not found — music row disabled")
    if not (shutil.which("xdotool") or os.environ.get("SWAYSOCK") or os.environ.get("HYPRLAND_INSTANCE_SIGNATURE")):
        print("note: no supported window tool — activity will read 'idle'")
    print("publishing presence  |  Ctrl+C to stop\n")

    last_fp, last_push = None, 0.0
    while True:
        media = get_media()
        activity, editor = get_foreground()
        payload = {"activity": activity, "editor": editor, "media": media, "ts": int(time.time())}

        fp, now = fingerprint(payload), time.time()
        if fp != last_fp or (now - last_push) >= HEARTBEAT_SEC:
            push_upstash(json.dumps(payload, ensure_ascii=False))
            last_fp, last_push, flag = fp, now, "PUSH"
        else:
            flag = "    "

        line = f"[{flag}] {activity}" + (f" — {editor}" if editor else "")
        if media:
            state = "▶" if media["playing"] else "⏸"
            artist = f" — {media['artist']}" if media["artist"] else ""
            line += f"  |  {state} {media['app']}: {media['title']}{artist}"
        print("\r" + line.ljust(110), end="", flush=True)

        time.sleep(POLL_SEC)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nbye")
