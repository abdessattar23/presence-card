#!/usr/bin/env bash
# EXPERIMENTAL — build a Presence binary on Linux. Requires Python 3 and, at
# runtime, WebKitGTK + an app-indicator:
#   sudo apt install gir1.2-webkit2-4.1 gir1.2-ayatanaappindicator3-0.1
# (The supported Linux path today is the systemd --user service running the
# agent, or `python3 presence_app.py`.) Package dist/presence/ as an AppImage
# for distribution — PyInstaller can't reliably bundle WebKitGTK itself.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 -m pip install -r requirements-common.txt pyinstaller
python3 app/branding/make_icons.py

python3 -m PyInstaller --noconfirm --name presence \
  --collect-all webview \
  --add-data "app/ui:app/ui" --add-data "app/branding:app/branding" \
  --add-data "themes:themes" --add-data "lib:lib" \
  presence_app.py

echo "built: dist/presence/ (onedir) — wrap as AppImage to distribute"
