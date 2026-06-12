"""
scripts/test_rules.py — unit tests for the privacy/rules/override engine.
Plain asserts, zero deps. Run: python scripts/test_rules.py  (exits non-zero on failure)
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import presence_rules as R  # noqa: E402

NOW = 1_700_000_000
DET = {"app_id": "code.exe", "activity": "coding", "editor": "VS Code"}
MEDIA = {"title": "Song", "artist": "Artist", "playing": True, "app": "Spotify"}

failures = []


def check(name, cond):
    if cond:
        print(f"  ok  {name}")
    else:
        failures.append(name)
        print(f"  XX  {name}")


def cfg(**over):
    base = {
        "rules": [],
        "overrides": {"active": False},
        "privacy": {"invisible": False, "hide_editor": False, "hide_media": False,
                    "idle_placeholder": "away", "pause_on_apps": []},
    }
    base.update(over)
    return base


# --- allow-list serializer: only the four fields ever escape ----------------
p = R.serialize_allowlist("CODING", "VS Code", {**MEDIA, "evil": "x"}, NOW)
check("serialize emits exactly the 4 card fields", set(p.keys()) == set(R.FIELDS))
check("serialize lowercases + sets ts", p["activity"] == "coding" and p["ts"] == NOW)
check("serialize strips unknown media keys", set(p["media"].keys()) == {"title", "artist", "playing", "app"})

# --- passthrough -------------------------------------------------------------
p = R.evaluate(DET, MEDIA, cfg(), NOW)
check("passthrough keeps activity/editor/media", p["activity"] == "coding" and p["editor"] == "VS Code" and p["media"]["title"] == "Song")

# --- rules -------------------------------------------------------------------
p = R.evaluate(DET, MEDIA, cfg(rules=[{"match": {"app": "code"}, "action": {"type": "exclude"}}]), NOW)
check("exclude -> placeholder, no editor/media", p["activity"] == "away" and p["editor"] is None and p["media"] is None)

p = R.evaluate(DET, MEDIA, cfg(rules=[{"match": {"app": "code"}, "action": {"type": "hide"}}]), NOW)
check("hide -> placeholder, no editor, media kept", p["activity"] == "away" and p["editor"] is None and p["media"] is not None)

p = R.evaluate(DET, MEDIA, cfg(rules=[{"match": {"app": "code"}, "action": {"type": "relabel", "activity": "deep work", "label": "focus"}}]), NOW)
check("relabel -> custom activity + label", p["activity"] == "deep work" and p["editor"] == "focus")

p = R.evaluate(DET, MEDIA, cfg(rules=[{"match": {"activity": "coding"}, "action": {"type": "force_activity", "activity": "building"}}]), NOW)
check("force_activity matches on activity, keeps editor", p["activity"] == "building" and p["editor"] == "VS Code")

p = R.evaluate(DET, MEDIA, cfg(rules=[{"match": {"app": "code"}, "action": {"type": "redact_media"}}]), NOW)
check("redact_media -> media None, activity kept", p["media"] is None and p["activity"] == "coding")

p = R.evaluate(DET, MEDIA, cfg(rules=[
    {"match": {"app": "code"}, "action": {"type": "relabel", "activity": "first"}},
    {"match": {"app": "code"}, "action": {"type": "relabel", "activity": "second"}},
]), NOW)
check("first match wins", p["activity"] == "first")

p = R.evaluate(DET, MEDIA, cfg(rules=[
    {"enabled": False, "match": {"app": "code"}, "action": {"type": "exclude"}},
]), NOW)
check("disabled rule ignored", p["activity"] == "coding")

p = R.evaluate(DET, MEDIA, cfg(rules=[{"match": {}, "action": {"type": "exclude"}}]), NOW)
check("empty match is not a catch-all", p["activity"] == "coding")

# --- privacy -----------------------------------------------------------------
p = R.evaluate(DET, MEDIA, cfg(privacy={"hide_editor": True, "idle_placeholder": "away"}), NOW)
check("hide_editor strips editor", p["editor"] is None and p["media"] is not None)

p = R.evaluate(DET, MEDIA, cfg(privacy={"hide_media": True, "idle_placeholder": "away"}), NOW)
check("hide_media strips media", p["media"] is None and p["editor"] == "VS Code")

p = R.evaluate(DET, MEDIA, cfg(privacy={"pause_on_apps": ["code"], "idle_placeholder": "away"}), NOW)
check("pause_on_apps -> publish nothing (None)", p is None)

# --- override ----------------------------------------------------------------
ov = {"active": True, "activity": "in a meeting", "editor": None,
      "media": {"title": "Lofi", "artist": "", "playing": True, "app": "Spotify"}, "expires_at": None}
p = R.evaluate(DET, MEDIA, cfg(overrides=ov), NOW)
check("override fakes activity + media", p["activity"] == "in a meeting" and p["media"]["title"] == "Lofi")

ov_exp = {**ov, "expires_at": NOW - 1}
p = R.evaluate(DET, MEDIA, cfg(overrides=ov_exp), NOW)
check("expired override is ignored", p["activity"] == "coding")
check("override_expired() detects expiry", R.override_expired(cfg(overrides=ov_exp), NOW) is True)

# invisible beats override (panic button)
p = R.evaluate(DET, MEDIA, cfg(overrides=ov, privacy={"invisible": True, "idle_placeholder": "away"}), NOW)
check("invisible beats override", p["activity"] == "away" and p["editor"] is None and p["media"] is None)

# --- done --------------------------------------------------------------------
if failures:
    print(f"\n{len(failures)} FAILED: {failures}")
    sys.exit(1)
print("\nall rule tests passed")
