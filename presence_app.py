"""
presence_app.py — the full Presence desktop app: a pywebview control panel
(Account / Preview / Override / Rules / Privacy / Appearance) backed by the
shared Engine, with a system-tray icon that stays in sync.

The UI is HTML/CSS/JS in app/ui/ (reusing the card's visual language); Python
exposes an `Api` bridge. Detection + the rules/privacy/override pipeline +
publishing all live in presence_core / presence_rules — this file is glue.

Run:   python presence_app.py        (or the packaged Presence binary)
Deps:  pip install -r requirements-common.txt  (+ per-OS extras)
"""

import json
import os
import sys
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path

import presence_config
import presence_core
import presence_rules

_BASE = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
UI_DIR = _BASE / "app" / "ui"
BRAND_DIR = _BASE / "app" / "branding"


def fetch_whoami(cfg):
    """Resolve handle + card URL from the cloud API key (or None)."""
    if presence_config.creds_mode(cfg) != "cloud":
        return None
    try:
        req = urllib.request.Request(
            f"{cfg['api_base'].rstrip('/')}/api/cloud/whoami",
            headers={"Authorization": f"Bearer {cfg['api_key']}"},
        )
        return json.loads(urllib.request.urlopen(req, timeout=8).read())
    except Exception:
        return None


def card_url(cfg, whoami=None):
    mode = presence_config.creds_mode(cfg)
    theme = cfg.get("theme", "zellij")
    q = "" if theme == "terminal" else f"?theme={theme}"
    if mode == "cloud" and whoami and whoami.get("card_url"):
        return whoami["card_url"] + q
    return cfg.get("card_url") or (cfg.get("api_base", "") + "/?theme=" + theme)


# ============================ bridge =======================================
class Api:
    """Methods callable from the webview as window.pywebview.api.<name>(...).
    All state lives in presence_config + the Engine, so these are thin + testable."""

    def __init__(self, app):
        self.app = app

    # -- read ---------------------------------------------------------------
    def get_state(self):
        cfg = presence_config.reload()
        whoami = fetch_whoami(cfg)
        return {
            "mode": presence_config.creds_mode(cfg),
            "handle": (whoami or {}).get("handle"),
            "card_url": card_url(cfg, whoami),
            "api_base": cfg.get("api_base"),
            "theme": cfg.get("theme", "zellij"),
            "themes": self.app.theme_names,
            "paused": self.app.engine.paused(),
            "autostart": self.app.is_autostart(),
            "privacy": cfg.get("privacy", {}),
            "overrides": cfg.get("overrides", {}),
            "rules": cfg.get("rules", []),
            "status": self.app.last_status,
        }

    # -- account ------------------------------------------------------------
    def set_account(self, api_key, api_base=None):
        presence_config.save({"api_key": (api_key or "").strip(),
                              "api_base": (api_base or presence_config.get().get("api_base")).strip()})
        return self.get_state()

    def set_upstash(self, url, token):
        presence_config.save({"upstash_url": (url or "").strip(), "upstash_token": (token or "").strip()})
        return self.get_state()

    # -- appearance ---------------------------------------------------------
    def set_theme(self, name):
        presence_config.save({"theme": name})
        return self.get_state()

    # -- engine controls ----------------------------------------------------
    def set_paused(self, value):
        self.app.engine.pause(bool(value))
        self.app.sync_tray()
        return self.get_state()

    def open_card(self):
        webbrowser.open(card_url(presence_config.get(), fetch_whoami(presence_config.get())))

    # -- privacy ------------------------------------------------------------
    def set_privacy(self, privacy):
        cur = dict(presence_config.get().get("privacy", {}))
        cur.update(privacy or {})
        presence_config.save_section("privacy", cur)
        self.app.sync_tray()
        return self.get_state()

    # -- override ("fake status") ------------------------------------------
    def set_override(self, activity, editor=None, media=None, minutes=0):
        ov = {
            "active": True,
            "activity": activity or "",
            "editor": editor or None,
            "media": media or None,
            "expires_at": (int(time.time()) + int(minutes) * 60) if minutes else None,
        }
        presence_config.save_section("overrides", ov)
        self.app.sync_tray()
        return self.get_state()

    def clear_override(self):
        presence_config.save_section("overrides", {"active": False, "activity": "", "editor": None,
                                                   "media": None, "expires_at": None})
        self.app.sync_tray()
        return self.get_state()

    # -- rules --------------------------------------------------------------
    def save_rules(self, rules):
        presence_config.save_section("rules", rules if isinstance(rules, list) else [])
        return self.get_state()


# ============================ app shell ====================================
RUN_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
APP_NAME = "Presence"


class App:
    def __init__(self):
        self.engine = presence_core.Engine(on_status=self._on_status)
        self.last_status = {"payload": None, "published": False}
        self.window = None
        self.icon = None
        self.theme_names = self._theme_names()

    @staticmethod
    def _theme_names():
        # read the JS registry's theme keys without a JS runtime
        try:
            idx = (Path(__file__).resolve().parent / "themes" / "index.js").read_text(encoding="utf-8")
            import re
            return re.findall(r'import\s+\w+\s+from\s+"\./([\w-]+)\.js"', idx)
        except Exception:
            return ["terminal", "zellij", "riad"]

    # -- engine status feed -------------------------------------------------
    def _on_status(self, payload, published):
        self.last_status = {"payload": payload, "published": published}
        line = "paused" if self.engine.paused() else (
            (payload.get("activity", "idle") if payload else "private"))
        if payload and payload.get("media"):
            line += f"  ♪ {payload['media']['title']}"
        if self.icon:
            self.icon.title = f"Presence — {line}"
        if self.window:
            try:
                self.window.evaluate_js(f"window.__onStatus && window.__onStatus({json.dumps(self.last_status)})")
            except Exception:
                pass

    # -- autostart (Windows registry; other OSes handled by service files) --
    def is_autostart(self):
        if not sys.platform.startswith("win"):
            return False
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY) as k:
                winreg.QueryValueEx(k, APP_NAME)
                return True
        except Exception:
            return False

    # -- tray ---------------------------------------------------------------
    def _tray_state(self):
        priv = presence_config.get().get("privacy", {})
        if priv.get("invisible"):
            return "private"
        return "paused" if self.engine.paused() else "live"

    def _tray_image(self):
        from PIL import Image, ImageDraw
        state = self._tray_state()
        png = BRAND_DIR / f"tray-{state}.png"
        try:
            return Image.open(png)
        except Exception:
            col = {"private": (120, 120, 130, 255), "paused": (255, 180, 84, 255),
                   "live": (57, 255, 158, 255)}[state]
            img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
            ImageDraw.Draw(img).ellipse((12, 12, 52, 52), fill=col)
            return img

    def sync_tray(self):
        if self.icon:
            self.icon.icon = self._tray_image()

    def start_tray(self):
        import pystray
        menu = pystray.Menu(
            pystray.MenuItem("Open Presence", lambda: self.window and self.window.show()),
            pystray.MenuItem("Pause", lambda i, it: self._toggle_pause(),
                             checked=lambda it: self.engine.paused()),
            pystray.MenuItem("Invisible", lambda i, it: self._toggle_invisible(),
                             checked=lambda it: presence_config.get().get("privacy", {}).get("invisible")),
            pystray.MenuItem("Open my card", lambda: webbrowser.open(
                card_url(presence_config.get(), fetch_whoami(presence_config.get())))),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Quit", lambda i, it: self.quit()),
        )
        self.icon = pystray.Icon(APP_NAME, self._tray_image(), "Presence", menu)
        self.icon.run_detached()

    def _toggle_pause(self):
        self.engine.pause(not self.engine.paused())
        self.sync_tray()

    def _toggle_invisible(self):
        priv = dict(presence_config.get().get("privacy", {}))
        priv["invisible"] = not priv.get("invisible")
        presence_config.save_section("privacy", priv)
        self.sync_tray()

    def quit(self):
        self.engine.stop()
        if self.icon:
            self.icon.stop()
        if self.window:
            self.window.destroy()

    def run(self):
        threading.Thread(target=self.engine.run, daemon=True).start()
        self.start_tray()
        import webview
        self.window = webview.create_window("Presence", str(UI_DIR / "index.html"),
                                            js_api=Api(self), width=760, height=620,
                                            min_size=(620, 520))
        webview.start()
        self.quit()


def main():
    if presence_config.setup_from_cli(sys.argv):
        sys.exit(0)
    App().run()


if __name__ == "__main__":
    main()
