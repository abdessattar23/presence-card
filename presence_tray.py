"""
presence_tray.py — run the Windows presence agent in the background, with a
system-tray icon instead of a console window.

It reuses all the detection/publishing logic from presence_agent.py; this file
only adds the tray UI, a pause toggle, and a "run at login" switch. Build it
into a single no-terminal presence.exe with PyInstaller — see windows/README.md.

Deps:  pip install -r requirements-windows.txt
Run:   pythonw presence_tray.py      (or just double-click presence.exe)
"""

import asyncio
import os
import sys
import threading
import time
import webbrowser
import winreg

import pystray
from PIL import Image, ImageDraw

import presence_config
# reuse the agent's brains — importing does NOT start the console loop
from presence_agent import (
    get_foreground, get_media, publish, fingerprint,
    HEARTBEAT_SEC, POLL_SEC,
)

APP_NAME = "Presence"
CARD_URL = presence_config.get().get("card_url") or "https://presence-neon.vercel.app/?theme=zellij"
RUN_KEY  = r"Software\Microsoft\Windows\CurrentVersion\Run"

_paused = threading.Event()
_state  = {"line": "starting…"}

# -- tray icon -------------------------------------------------------------
GREEN = (57, 255, 158, 255)
AMBER = (255, 180, 84, 255)


def _icon(color):
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    ImageDraw.Draw(img).ellipse((12, 12, 52, 52), fill=color)
    return img


# -- run at login (HKCU Run key) -------------------------------------------
def _run_command():
    if getattr(sys, "frozen", False):           # packaged exe
        return f'"{sys.executable}"'
    pyw = os.path.join(os.path.dirname(sys.executable), "pythonw.exe")
    exe = pyw if os.path.exists(pyw) else sys.executable
    return f'"{exe}" "{os.path.abspath(__file__)}"'


def _is_startup(_=None):
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY) as k:
            winreg.QueryValueEx(k, APP_NAME)
            return True
    except FileNotFoundError:
        return False


def _toggle_startup(icon, item):
    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, RUN_KEY, 0, winreg.KEY_SET_VALUE) as k:
        if _is_startup():
            winreg.DeleteValue(k, APP_NAME)
        else:
            winreg.SetValueEx(k, APP_NAME, 0, winreg.REG_SZ, _run_command())


# -- menu actions ----------------------------------------------------------
def _toggle_pause(icon, item):
    if _paused.is_set():
        _paused.clear()
    else:
        _paused.set()
    icon.icon = _icon(AMBER if _paused.is_set() else GREEN)


def _open_card(icon, item):
    webbrowser.open(CARD_URL)


def _quit(icon, item):
    icon.visible = False
    icon.stop()


# -- background agent loop -------------------------------------------------
def _agent_loop():
    asyncio.set_event_loop(asyncio.new_event_loop())
    loop = asyncio.get_event_loop()
    last_fp, last_push = None, 0.0
    while True:
        if _paused.is_set():
            _state["line"] = "paused"
            time.sleep(1)
            continue
        try:
            media = loop.run_until_complete(get_media())
            activity, editor, _ = get_foreground()
            payload = {"activity": activity, "editor": editor, "media": media, "ts": int(time.time())}
            fp, now = fingerprint(payload), time.time()
            if fp != last_fp or (now - last_push) >= HEARTBEAT_SEC:
                publish(payload)
                last_fp, last_push = fp, now
            line = activity + (f" — {editor}" if editor else "")
            if media:
                line += ("  > " if media["playing"] else "  || ") + media["title"]
            _state["line"] = line[:60]
        except Exception as e:
            _state["line"] = f"error: {e}"
        time.sleep(POLL_SEC)


def main():
    presence_config.ensure_interactive()       # first run: pop the setup dialog
    threading.Thread(target=_agent_loop, daemon=True).start()
    menu = pystray.Menu(
        pystray.MenuItem(lambda item: _state["line"], None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Paused", _toggle_pause, checked=lambda item: _paused.is_set()),
        pystray.MenuItem("Open my card", _open_card),
        pystray.MenuItem("Run at login", _toggle_startup, checked=_is_startup),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem("Quit", _quit),
    )
    pystray.Icon(APP_NAME, _icon(GREEN), "Presence — live", menu).run()


if __name__ == "__main__":
    main()
