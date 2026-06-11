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
    "upstash_url": "PRESENCE_UPSTASH_URL",
    "upstash_token": "PRESENCE_UPSTASH_TOKEN",
    "gist_id": "PRESENCE_GIST_ID",
    "gist_token": "PRESENCE_GIST_TOKEN",
    "card_url": "PRESENCE_CARD_URL",
}
DEFAULTS = {
    "gist_filename": "status.json",
    "card_url": "https://presence-neon.vercel.app/?theme=zellij",
}

_cache = None


def config_path() -> Path:
    """presence.config.json next to the exe (frozen) or this module."""
    base = Path(sys.executable).parent if getattr(sys, "frozen", False) else Path(__file__).resolve().parent
    return base / "presence.config.json"


def _read() -> dict:
    cfg = dict(DEFAULTS)
    p = config_path()
    if p.exists():
        try:
            cfg.update(json.loads(p.read_text(encoding="utf-8")))
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


def has_creds(cfg: dict = None) -> bool:
    cfg = cfg if cfg is not None else get()
    return bool(cfg.get("upstash_url") and cfg.get("upstash_token"))


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
        text="Paste your Upstash REST URL and token.\nThey're on your Upstash database page.",
        justify="left",
    ).grid(column=0, row=0, columnspan=2, sticky="w", pady=(0, 10))
    ttk.Label(frm, text="REST URL").grid(column=0, row=1, sticky="w")
    url = ttk.Entry(frm, width=44)
    url.grid(column=1, row=1, pady=3)
    ttk.Label(frm, text="REST token").grid(column=0, row=2, sticky="w")
    tok = ttk.Entry(frm, width=44, show="•")
    tok.grid(column=1, row=2, pady=3)

    def _ok():
        result["upstash_url"] = url.get().strip()
        result["upstash_token"] = tok.get().strip()
        root.destroy()

    btns = ttk.Frame(frm)
    btns.grid(column=0, row=3, columnspan=2, pady=(12, 0))
    ttk.Button(btns, text="Save", command=_ok).grid(column=0, row=0, padx=4)
    ttk.Button(btns, text="Cancel", command=root.destroy).grid(column=1, row=0, padx=4)
    url.focus()
    root.mainloop()

    if result.get("upstash_url") and result.get("upstash_token"):
        return result
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
