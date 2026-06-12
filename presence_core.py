"""
presence_core.py — the shared engine: detect → rules → publish, in one place.

The desktop app (presence_app.py) runs this Engine; it also lets the three CLI
agents collapse onto one loop later. Detection is platform-specific (lazy
imported so importing this module never pulls win32/winsdk on macOS/Linux);
everything downstream — rule evaluation (presence_rules) and publishing — is
shared and stdlib-only (urllib, no requests dependency).
"""

import asyncio
import json
import sys
import threading
import time
import urllib.request

import presence_config
import presence_rules

POLL_SEC = 3
HEARTBEAT_SEC = 60


# ============================ detection ====================================
class Detector:
    """Returns (activity, editor, app_id). app_id is the normalized window/app
    identifier used for rule matching. Never returns the window title."""

    def foreground(self):
        return ("idle", None, "")

    def media(self):
        return None


class WindowsDetector(Detector):
    MAP = {
        "cursor.exe": ("coding", "Cursor"), "code.exe": ("coding", "VS Code"),
        "devenv.exe": ("coding", "Visual Studio"), "pycharm64.exe": ("coding", "PyCharm"),
        "idea64.exe": ("coding", "IntelliJ"), "sublime_text.exe": ("coding", "Sublime"),
        "windowsterminal.exe": ("terminal", None), "wt.exe": ("terminal", None),
        "powershell.exe": ("terminal", None), "cmd.exe": ("terminal", None),
        "chrome.exe": ("browsing", None), "msedge.exe": ("browsing", None),
        "firefox.exe": ("browsing", None), "brave.exe": ("browsing", None),
        "opera.exe": ("browsing", None), "zen.exe": ("browsing", None),
        "spotify.exe": ("listening", "Spotify"), "vlc.exe": ("watching", "VLC"),
        "explorer.exe": ("desktop", None),
    }

    def __init__(self):
        import win32gui, win32process, psutil
        from winsdk.windows.media.control import (
            GlobalSystemMediaTransportControlsSessionManager as MM,
            GlobalSystemMediaTransportControlsSessionPlaybackStatus as PS,
        )
        self._gui, self._proc, self._ps = win32gui, win32process, psutil
        self._MM, self._PS = MM, PS
        self._loop = asyncio.new_event_loop()

    def foreground(self):
        try:
            hwnd = self._gui.GetForegroundWindow()
            _, pid = self._proc.GetWindowThreadProcessId(hwnd)
            proc = self._ps.Process(pid).name().lower()
            activity, editor = self.MAP.get(proc, (proc.replace(".exe", ""), None))
            return activity, editor, proc
        except Exception:
            return "idle", None, ""

    async def _media(self):
        mgr = await self._MM.request_async()
        s = mgr.get_current_session()
        if s is None:
            return None
        info = await s.try_get_media_properties_async()
        title = (info.title or "").strip()
        if not title:
            return None
        aumid = (s.source_app_user_model_id or "").lower()
        app = "Spotify" if "spotify" in aumid else ("Browser" if any(b in aumid for b in ("chrome", "edge", "firefox", "brave", "opera")) else "media")
        return {"title": title, "artist": (info.artist or "").strip().removesuffix(" - Topic"),
                "playing": s.get_playback_info().playback_status == self._PS.PLAYING, "app": app}

    def media(self):
        try:
            return self._loop.run_until_complete(self._media())
        except Exception:
            return None


class _SubprocessDetector(Detector):
    """Shared helper for macOS/Linux (subprocess-based)."""

    @staticmethod
    def _run(cmd, timeout=4):
        import subprocess
        try:
            return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout).stdout.strip()
        except Exception:
            return ""


class MacDetector(_SubprocessDetector):
    MAP = {
        "Cursor": ("coding", "Cursor"), "Code": ("coding", "VS Code"), "Xcode": ("coding", "Xcode"),
        "PyCharm": ("coding", "PyCharm"), "IntelliJ IDEA": ("coding", "IntelliJ"),
        "Sublime Text": ("coding", "Sublime"), "Zed": ("coding", "Zed"),
        "iTerm2": ("terminal", None), "Terminal": ("terminal", None), "Warp": ("terminal", None),
        "Alacritty": ("terminal", None), "kitty": ("terminal", None),
        "Safari": ("browsing", None), "Google Chrome": ("browsing", None), "Firefox": ("browsing", None),
        "Arc": ("browsing", None), "Brave Browser": ("browsing", None),
        "Spotify": ("listening", "Spotify"), "Music": ("listening", "Music"),
        "VLC": ("watching", "VLC"), "Finder": ("desktop", None),
    }

    def foreground(self):
        name = self._run(["osascript", "-e",
                          'tell application "System Events" to get name of first application process whose frontmost is true'])
        if not name:
            return "idle", None, ""
        activity, editor = self.MAP.get(name, (name.lower(), None))
        return activity, editor, name.lower()

    def media(self):
        import shutil
        if not shutil.which("nowplaying-cli"):
            return None
        out = self._run(["nowplaying-cli", "get", "title", "artist", "playbackRate"]).splitlines()
        title = (out[0] if out else "").strip()
        if not title or title == "null":
            return None
        artist = (out[1] if len(out) > 1 else "").strip()
        rate = (out[2] if len(out) > 2 else "0").strip()
        return {"title": title, "artist": "" if artist == "null" else artist.removesuffix(" - Topic"),
                "playing": rate not in ("0", "0.0", "null", ""), "app": "media"}


class LinuxDetector(_SubprocessDetector):
    MAP = [("cursor", ("coding", "Cursor")), ("codium", ("coding", "VSCodium")), ("code", ("coding", "VS Code")),
           ("jetbrains-pycharm", ("coding", "PyCharm")), ("jetbrains-idea", ("coding", "IntelliJ")),
           ("sublime_text", ("coding", "Sublime")), ("zed", ("coding", "Zed")), ("nvim", ("coding", "Neovim")),
           ("alacritty", ("terminal", None)), ("kitty", ("terminal", None)), ("wezterm", ("terminal", None)),
           ("gnome-terminal", ("terminal", None)), ("konsole", ("terminal", None)), ("foot", ("terminal", None)),
           ("firefox", ("browsing", None)), ("chromium", ("browsing", None)), ("chrome", ("browsing", None)),
           ("brave", ("browsing", None)), ("librewolf", ("browsing", None)),
           ("spotify", ("listening", "Spotify")), ("vlc", ("watching", "VLC")), ("mpv", ("watching", "mpv"))]

    def _active_class(self):
        import os, shutil
        if os.environ.get("HYPRLAND_INSTANCE_SIGNATURE") and shutil.which("hyprctl"):
            try:
                return (json.loads(self._run(["hyprctl", "activewindow", "-j"])).get("class") or "").lower()
            except Exception:
                pass
        if os.environ.get("SWAYSOCK") and shutil.which("swaymsg"):
            try:
                def find(n):
                    if n.get("focused"):
                        return n
                    for c in n.get("nodes", []) + n.get("floating_nodes", []):
                        h = find(c)
                        if h:
                            return h
                n = find(json.loads(self._run(["swaymsg", "-t", "get_tree"]))) or {}
                return (n.get("app_id") or n.get("window_properties", {}).get("class") or "").lower()
            except Exception:
                pass
        if shutil.which("xdotool"):
            return self._run(["xdotool", "getactivewindow", "getwindowclassname"]).lower()
        return ""

    def foreground(self):
        cls = self._active_class()
        if not cls:
            return "idle", None, ""
        for needle, (activity, editor) in self.MAP:
            if needle in cls:
                return activity, editor, cls
        return cls, None, cls

    def media(self):
        import shutil
        if not shutil.which("playerctl"):
            return None
        out = self._run(["playerctl", "metadata", "--format", "{{title}}\t{{artist}}\t{{status}}\t{{playerName}}"])
        parts = out.split("\t")
        title = parts[0].strip() if parts and parts[0] else ""
        if not title:
            return None
        player = parts[3].strip() if len(parts) > 3 else ""
        return {"title": title, "artist": (parts[1].strip() if len(parts) > 1 else "").removesuffix(" - Topic"),
                "playing": (parts[2].strip().lower() if len(parts) > 2 else "") == "playing",
                "app": "Spotify" if "spotify" in player.lower() else (player.capitalize() or "media")}


def make_detector():
    if sys.platform.startswith("win"):
        return WindowsDetector()
    if sys.platform == "darwin":
        return MacDetector()
    return LinuxDetector()


# ============================ publishing ===================================
def _post(url, headers, body):
    req = urllib.request.Request(url, data=body.encode("utf-8"), headers=headers, method="POST")
    urllib.request.urlopen(req, timeout=8).read()


def publish(value, cfg=None):
    """Publish a serialized payload to whichever backend is configured."""
    cfg = cfg or presence_config.get()
    mode = presence_config.creds_mode(cfg)
    try:
        if mode == "cloud":
            _post(f"{cfg['api_base'].rstrip('/')}/api/cloud/ingest",
                  {"Authorization": f"Bearer {cfg['api_key']}", "Content-Type": "application/json"}, value)
        elif mode == "upstash":
            _post(f"{cfg['upstash_url'].rstrip('/')}/set/presence",
                  {"Authorization": f"Bearer {cfg['upstash_token']}"}, value)
    except Exception as e:
        print("[publish] failed:", e)


# ============================ engine =======================================
class Engine:
    """Owns the detect→rules→publish loop. on_status(payload, published) fires
    each tick so the tray + window can reflect state from one source."""

    def __init__(self, detector=None, on_status=None):
        self._detector = detector
        self.on_status = on_status
        self._stop = threading.Event()
        self._paused = threading.Event()
        self._last_fp = None
        self._last_push = 0.0

    @property
    def detector(self):
        if self._detector is None:
            self._detector = make_detector()
        return self._detector

    def pause(self, value=True):
        self._paused.set() if value else self._paused.clear()

    def paused(self):
        return self._paused.is_set()

    def stop(self):
        self._stop.set()

    def tick(self, now=None):
        now = now or time.time()
        cfg = presence_config.reload()  # pick up live edits from the GUI
        if presence_rules.override_expired(cfg, now):
            ov = dict(cfg.get("overrides", {}))
            ov["active"] = False
            cfg = presence_config.save_section("overrides", ov)
        media = self.detector.media()
        activity, editor, app_id = self.detector.foreground()
        payload = presence_rules.evaluate(
            {"app_id": app_id, "activity": activity, "editor": editor}, media, cfg, now)
        published = False
        if payload is not None:
            fp = json.dumps({k: payload[k] for k in ("activity", "editor", "media")}, ensure_ascii=False)
            if fp != self._last_fp or (now - self._last_push) >= HEARTBEAT_SEC:
                publish(json.dumps(payload, ensure_ascii=False), cfg)
                self._last_fp, self._last_push, published = fp, now, True
        if self.on_status:
            self.on_status(payload, published)
        return payload, published

    def run(self):
        while not self._stop.is_set():
            if not self._paused.is_set():
                try:
                    self.tick()
                except Exception as e:
                    print("[engine] tick error:", e)
            time.sleep(POLL_SEC)
