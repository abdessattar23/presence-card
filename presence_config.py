"""
presence_config.py — one place to load/save settings, shared by every agent
(Windows/macOS/Linux) and the tray app.

Resolution per value: environment variable first, then presence.config.json
sitting next to the running program (or exe). First run with no credentials
can pop a small dialog to collect them — see ensure_interactive().
"""

import json
import os
import sys
from pathlib import Path

# config key -> environment variable that overrides it
ENV = {
    "api_key": "PRESENCE_API_KEY",
    "api_base": "PRESENCE_API_BASE",
    "upstash_url": "PRESENCE_UPSTASH_URL",
    "upstash_token": "PRESENCE_UPSTASH_TOKEN",
    "gist_id": "PRESENCE_GIST_ID",
    "gist_token": "PRESENCE_GIST_TOKEN",
    "card_url": "PRESENCE_CARD_URL",
}
DEFAULTS = {
    "schema_version": 2,
    "gist_filename": "status.json",
    "api_base": "https://presence-neon.vercel.app",
    "card_url": "https://presence-neon.vercel.app/?theme=zellij",
    "theme": "zellij",
    "autostart": False,
    # rules/override/privacy power the desktop app's control + privacy features
    "rules": [],
    "overrides": {"active": False, "activity": "", "editor": None, "media": None, "expires_at": None},
    "privacy": {
        "invisible": False,
        "hide_editor": False,
        "hide_media": False,
        "idle_placeholder": "away",
        "pause_on_apps": [],
    },
}

_cache = None


def _deep_merge(base: dict, override: dict) -> dict:
    """Merge override onto base recursively (so loaded config keeps default
    sub-keys for nested sections). Lists replace, scalars replace."""
    out = dict(base)
    for k, v in (override or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def config_path() -> Path:
    """presence.config.json next to the exe (frozen) or this module."""
    base = Path(sys.executable).parent if getattr(sys, "frozen", False) else Path(__file__).resolve().parent
    return base / "presence.config.json"


def _read() -> dict:
    cfg = dict(DEFAULTS)
    p = config_path()
    if p.exists():
        try:
            # deep-merge so a config that predates the rules/privacy sections
            # still gets their defaults — non-destructive, no migration rewrite
            cfg = _deep_merge(cfg, json.loads(p.read_text(encoding="utf-8")))
        except Exception:
            pass
    for key, env in ENV.items():
        v = os.environ.get(env)
        if v:
            cfg[key] = v
        cfg.setdefault(key, "")
    return cfg


def get() -> dict:
    global _cache
    if _cache is None:
        _cache = _read()
    return _cache


def reload() -> dict:
    global _cache
    _cache = _read()
    return _cache


def creds_mode(cfg: dict = None) -> str | None:
    """Which backend the agent should publish to: 'cloud', 'upstash', or None."""
    cfg = cfg if cfg is not None else get()
    if cfg.get("api_key"):
        return "cloud"
    if cfg.get("upstash_url") and cfg.get("upstash_token"):
        return "upstash"
    return None


def has_creds(cfg: dict = None) -> bool:
    return creds_mode(cfg) is not None


def setup_from_cli(argv) -> bool:
    """Handle `--setup --api-key KEY [--api-base URL]` (or upstash pair). Returns
    True if it handled setup (caller should exit). Lets the dashboard hand users
    a one-liner instead of editing JSON."""
    if "--setup" not in argv:
        return False

    def _opt(name):
        if name in argv:
            i = argv.index(name)
            if i + 1 < len(argv):
                return argv[i + 1]
        return None

    vals = {}
    for flag, key in (("--api-key", "api_key"), ("--api-base", "api_base"),
                      ("--upstash-url", "upstash_url"), ("--upstash-token", "upstash_token")):
        v = _opt(flag)
        if v:
            vals[key] = v
    if vals:
        save(vals)
        print("saved config to", config_path())
        print("mode:", creds_mode())
    else:
        print("nothing to set — pass --api-key KEY (and optionally --api-base URL)")
    return True


def save(values: dict) -> dict:
    """Merge values into presence.config.json (preserving other keys)."""
    p = config_path()
    data = {}
    if p.exists():
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            data = {}
    data.update({k: v for k, v in values.items() if v is not None})
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return reload()


def save_section(name: str, value) -> dict:
    """Replace a whole nested section (rules list / overrides / privacy) atomically."""
    p = config_path()
    data = {}
    if p.exists():
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            data = {}
    data[name] = value
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return reload()


def prompt() -> dict | None:
    """Tiny Tk dialog for Upstash creds. None if Tk is unavailable or cancelled."""
    try:
        import tkinter as tk
        from tkinter import ttk
    except Exception:
        return None

    result = {}
    root = tk.Tk()
    root.title("Presence — first-time setup")
    root.resizable(False, False)
    frm = ttk.Frame(root, padding=16)
    frm.grid()
    ttk.Label(
        frm,
        text="Hosted: paste your API key from the dashboard (easiest).\n"
             "Or self-host: paste your Upstash REST URL + token.",
        justify="left",
    ).grid(column=0, row=0, columnspan=2, sticky="w", pady=(0, 10))
    ttk.Label(frm, text="API key").grid(column=0, row=1, sticky="w")
    key = ttk.Entry(frm, width=44, show="•")
    key.grid(column=1, row=1, pady=3)
    ttk.Separator(frm, orient="horizontal").grid(column=0, row=2, columnspan=2, sticky="ew", pady=8)
    ttk.Label(frm, text="Upstash URL").grid(column=0, row=3, sticky="w")
    url = ttk.Entry(frm, width=44)
    url.grid(column=1, row=3, pady=3)
    ttk.Label(frm, text="Upstash token").grid(column=0, row=4, sticky="w")
    tok = ttk.Entry(frm, width=44, show="•")
    tok.grid(column=1, row=4, pady=3)

    def _ok():
        result["api_key"] = key.get().strip()
        result["upstash_url"] = url.get().strip()
        result["upstash_token"] = tok.get().strip()
        root.destroy()

    btns = ttk.Frame(frm)
    btns.grid(column=0, row=5, columnspan=2, pady=(12, 0))
    ttk.Button(btns, text="Save", command=_ok).grid(column=0, row=0, padx=4)
    ttk.Button(btns, text="Cancel", command=root.destroy).grid(column=1, row=0, padx=4)
    key.focus()
    root.mainloop()

    if result.get("api_key"):
        return {"api_key": result["api_key"]}
    if result.get("upstash_url") and result.get("upstash_token"):
        return {"upstash_url": result["upstash_url"], "upstash_token": result["upstash_token"]}
    return None


def ensure_interactive() -> bool:
    """If creds are missing, try to prompt for and save them. Returns True if set."""
    if has_creds():
        return True
    vals = prompt()
    if vals:
        save(vals)
        return has_creds()
    return False
