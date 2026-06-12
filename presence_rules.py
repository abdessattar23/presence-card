"""
presence_rules.py — the detect → rules → privacy → override → publish pipeline.

Pure functions, no platform deps, fully unit-tested (scripts/test_rules.py).
This is where the product's control + privacy features live, and the last
function — serialize_allowlist — is the hard privacy backstop: only the four
card fields can ever leave the process, so no rule misconfiguration can leak a
window title, path, or URL.

Pipeline order (evaluate):
    detect → pause-gate → rules(first match) → privacy(global)
           → override(+expiry) → allow-list serialize
"""

FIELDS = ("activity", "editor", "media", "ts")


def serialize_allowlist(activity, editor, media, now):
    """The only place a payload is constructed. Emits exactly FIELDS."""
    act = (str(activity or "idle").strip().lower())[:24] or "idle"
    ed = (str(editor)[:40] if editor else None)
    m = None
    if isinstance(media, dict) and media.get("title"):
        m = {
            "title": str(media["title"])[:120],
            "artist": str(media.get("artist") or "")[:80],
            "playing": bool(media.get("playing")),
            "app": str(media.get("app") or "")[:24],
        }
    return {"activity": act, "editor": ed, "media": m, "ts": int(now)}


def _match(match, app_id, activity):
    """A rule matches if every present criterion fits. Empty match → no match
    (so a blank rule can't become an accidental catch-all)."""
    app = (match.get("app") or "").lower()
    act = (match.get("activity") or "").lower()
    if not app and not act:
        return False
    if app and app != app_id and app not in app_id:
        return False
    if act and act != (activity or "").lower():
        return False
    return True


def override_expired(cfg, now):
    """True if an active manual override has passed its expiry (caller persists)."""
    ov = cfg.get("overrides", {})
    exp = ov.get("expires_at")
    return bool(ov.get("active") and exp and now >= exp)


def evaluate(detected, media, cfg, now):
    """
    detected: {app_id, activity, editor}.  Returns a serialized payload dict,
    or None meaning "publish nothing" (paused / private-pause).
    """
    app_id = (detected.get("app_id") or "").lower()
    activity = detected.get("activity") or "idle"
    editor = detected.get("editor")

    priv = cfg.get("privacy", {}) or {}
    placeholder = priv.get("idle_placeholder") or "away"

    # 1 — pause when a sensitive app is focused: publish nothing at all
    for pa in priv.get("pause_on_apps", []) or []:
        if pa and pa.lower() in app_id:
            return None

    # 2 — rules, first enabled match wins
    for rule in cfg.get("rules", []) or []:
        if not rule.get("enabled", True):
            continue
        if not _match(rule.get("match", {}) or {}, app_id, activity):
            continue
        action = rule.get("action", {}) or {}
        t = action.get("type")
        if t == "exclude":
            activity, editor, media = placeholder, None, None
        elif t == "hide":
            activity, editor = placeholder, None  # media kept (unless privacy hides it)
        elif t == "relabel":
            if action.get("activity"):
                activity = action["activity"]
            if "label" in action:
                editor = action.get("label")
        elif t == "force_activity":
            if action.get("activity"):
                activity = action["activity"]
        elif t == "redact_media":
            media = None
        # unknown action types are a safe no-op
        break

    # 3 — global privacy switches
    if priv.get("hide_editor"):
        editor = None
    if priv.get("hide_media"):
        media = None
    invisible = bool(priv.get("invisible"))
    if invisible:
        activity, editor, media = placeholder, None, None

    # 4 — manual override (the "fake status"), unless invisible (the panic button wins)
    ov = cfg.get("overrides", {}) or {}
    if ov.get("active") and not invisible and not override_expired(cfg, now):
        activity = ov.get("activity") or activity
        editor = ov.get("editor", editor)
        if ov.get("media") is not None:
            media = ov.get("media")

    # 5 — allow-list serialize (privacy backstop)
    return serialize_allowlist(activity, editor, media, now)
