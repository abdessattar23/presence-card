"""
scripts/test_core.py — Engine tick logic (fake detector + captured publish).
Run: python scripts/test_core.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import presence_core as core      # noqa: E402
import presence_config as pc      # noqa: E402

NOW = 1_700_000_000
failures = []


def check(name, cond):
    print(("  ok  " if cond else "  XX  ") + name)
    if not cond:
        failures.append(name)


class FakeDetector(core.Detector):
    def __init__(self, app_id="code.exe", activity="coding", editor="VS Code", media=None):
        self._fg = (activity, editor, app_id)
        self._media = media

    def foreground(self):
        return self._fg

    def media(self):
        return self._media


def run_tick(detector, cfg, captured):
    pc.reload = lambda: cfg                       # don't touch the real config file
    core.publish = lambda value, c=None: captured.append(value)
    eng = core.Engine(detector=detector)
    return eng, eng.tick(now=NOW)


def base_cfg(**over):
    c = {"rules": [], "overrides": {"active": False}, "api_base": "x",
         "privacy": {"invisible": False, "hide_editor": False, "hide_media": False,
                     "idle_placeholder": "away", "pause_on_apps": []}}
    c.update(over)
    return c


# rules flow through the engine and reach publish
cap = []
det = FakeDetector(media={"title": "Song", "artist": "A", "playing": True, "app": "Spotify"})
eng, (payload, published) = run_tick(
    det, base_cfg(rules=[{"match": {"app": "code"}, "action": {"type": "relabel", "activity": "deep work"}}]), cap)
check("engine applies rules -> payload", payload["activity"] == "deep work")
check("engine published on first tick", published and len(cap) == 1)
check("published value is the serialized payload", '"activity": "deep work"' in cap[0])

# change-dedup: identical second tick within heartbeat does not re-publish
_, published2 = eng.tick(now=NOW + 1)
check("no re-publish when unchanged within heartbeat", published2 is False and len(cap) == 1)

# pause_on_apps -> publish nothing
cap2 = []
_, (p, pub) = run_tick(FakeDetector(), base_cfg(privacy={"pause_on_apps": ["code"], "idle_placeholder": "away",
                       "invisible": False, "hide_editor": False, "hide_media": False}), cap2)
check("pause_on_apps -> no publish", p is None and pub is False and len(cap2) == 0)

# live Windows detector smoke (only on Windows; must not throw)
if sys.platform.startswith("win"):
    try:
        d = core.WindowsDetector()
        fg = d.foreground()
        m = d.media()
        check("WindowsDetector.foreground returns 3-tuple", isinstance(fg, tuple) and len(fg) == 3)
        check("WindowsDetector.media returns dict or None", m is None or isinstance(m, dict))
    except Exception as e:
        check(f"WindowsDetector smoke (no throw): {e}", False)

if failures:
    print(f"\n{len(failures)} FAILED: {failures}")
    sys.exit(1)
print("\nall core tests passed")
