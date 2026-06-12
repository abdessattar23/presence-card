"""
scripts/test_app_bridge.py — the desktop app's Api bridge logic, without a GUI.
In-memory config + a fake app shell. Run: python scripts/test_app_bridge.py
"""

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import presence_config as pc      # noqa: E402

# ---- in-memory config (don't touch the real presence.config.json) ----------
STORE = {
    "api_base": "https://example.test", "card_url": "https://example.test/?theme=zellij",
    "theme": "zellij", "rules": [], "overrides": {"active": False},
    "privacy": {"invisible": False, "hide_editor": False, "hide_media": False,
                "idle_placeholder": "away", "pause_on_apps": []},
}
pc.get = lambda: STORE
pc.reload = lambda: STORE
pc.creds_mode = lambda cfg=None: "upstash"  # avoids network in fetch_whoami
pc.save = lambda vals: (STORE.update({k: v for k, v in vals.items() if v is not None}), STORE)[1]
pc.save_section = lambda name, val: (STORE.__setitem__(name, val), STORE)[1]

import presence_app as app_mod    # noqa: E402

failures = []


def check(name, cond):
    print(("  ok  " if cond else "  XX  ") + name)
    if not cond:
        failures.append(name)


class FakeEngine:
    def __init__(self):
        self._p = False
    def paused(self):
        return self._p
    def pause(self, v=True):
        self._p = bool(v)


class FakeApp:
    def __init__(self):
        self.engine = FakeEngine()
        self.theme_names = ["terminal", "zellij", "nord"]
        self.last_status = {"payload": {"activity": "coding"}, "published": True}
    def sync_tray(self):
        pass
    def is_autostart(self):
        return False


api = app_mod.Api(FakeApp())

# get_state assembles the expected shape
st = api.get_state()
check("get_state has core keys", all(k in st for k in
      ["mode", "theme", "themes", "paused", "privacy", "overrides", "rules", "status", "card_url"]))
check("get_state mode/theme", st["mode"] == "upstash" and st["theme"] == "zellij")

# override with expiry
now = int(time.time())
api.set_override("in a meeting", editor=None, media={"title": "Lofi", "artist": "", "playing": True, "app": "Spotify"}, minutes=30)
ov = STORE["overrides"]
check("override active + activity", ov["active"] and ov["activity"] == "in a meeting")
check("override media set", ov["media"]["title"] == "Lofi")
check("override expiry ~30min", now + 1700 < ov["expires_at"] < now + 1900)

api.clear_override()
check("clear_override deactivates", STORE["overrides"]["active"] is False)

# rules
api.save_rules([{"match": {"app": "discord.exe"}, "action": {"type": "exclude"}}])
check("save_rules persists", STORE["rules"][0]["action"]["type"] == "exclude")

# privacy merge (only invisible toggled, others preserved)
api.set_privacy({"invisible": True})
check("privacy invisible set", STORE["privacy"]["invisible"] is True)
check("privacy other keys preserved", STORE["privacy"]["idle_placeholder"] == "away")

# theme
api.set_theme("nord")
check("set_theme", STORE["theme"] == "nord")

# pause
api.set_paused(True)
check("set_paused toggles engine", api.app.engine.paused() is True)

if failures:
    print(f"\n{len(failures)} FAILED: {failures}")
    sys.exit(1)
print("\nall bridge tests passed")
