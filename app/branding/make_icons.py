"""
app/branding/make_icons.py — generate every icon from one mark (the khatim
star) using Pillow, so the app, tray, and website share the exact same logo.

Outputs (run from the repo root, or it resolves paths itself):
  windows/icon.ico            multi-size app/exe icon (live state)
  favicon.ico                 website favicon
  app/branding/tray-*.png     tray states: live / paused / private / active
  app/branding/icon_*.png     macOS .iconset sources (build.sh -> .icns)
  linux/icons/*.png           hicolor app-menu icons

No SVG rasterizer needed — the mark is drawn directly (matches presence.svg).
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent.parent
BRAND = ROOT / "app" / "branding"

COBALT = (14, 35, 72, 255)
AMBER = (232, 177, 60, 255)
STATES = {
    "live": (57, 255, 158, 255),
    "active": (91, 255, 170, 255),
    "paused": (255, 180, 84, 255),
    "private": (120, 120, 130, 255),
}


def _rot(p, c, deg):
    a = math.radians(deg)
    x, y = p[0] - c, p[1] - c
    return (c + x * math.cos(a) - y * math.sin(a), c + x * math.sin(a) + y * math.cos(a))


def _star(d, c, r, fill):
    sq = [(c - r, c - r), (c + r, c - r), (c + r, c + r), (c - r, c + r)]
    d.polygon(sq, fill=fill)
    d.polygon([_rot(p, c, 45) for p in sq], fill=fill)


def draw(n, dot=STATES["live"], bg=True):
    img = Image.new("RGBA", (n, n), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = n / 2
    if bg:
        pad = n * 0.055
        d.rounded_rectangle([pad, pad, n - pad, n - pad], radius=n * 0.18, fill=COBALT)
    _star(d, c, n * 0.30, AMBER)        # saffron 8-point star
    _star(d, c, n * 0.165, COBALT)      # negative-space inner star -> ring
    rd = n * 0.086                       # status dot
    d.ellipse([c - rd, c - rd, c + rd, c + rd], fill=dot)
    return img


def main():
    BRAND.mkdir(parents=True, exist_ok=True)
    (ROOT / "linux" / "icons").mkdir(parents=True, exist_ok=True)
    (ROOT / "windows").mkdir(exist_ok=True)

    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    base = draw(256)
    base.save(ROOT / "windows" / "icon.ico", sizes=ico_sizes)
    base.save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    for name, col in STATES.items():
        draw(64, col).save(BRAND / f"tray-{name}.png")

    for s in (16, 32, 64, 128, 256, 512, 1024):
        draw(s).save(BRAND / f"icon_{s}.png")
    for s in (16, 32, 48, 64, 128, 256):
        draw(s).save(ROOT / "linux" / "icons" / f"presence-{s}.png")

    print("icons generated: windows/icon.ico, favicon.ico, app/branding/tray-*.png + icon_*.png, linux/icons/*")


if __name__ == "__main__":
    main()
