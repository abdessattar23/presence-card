#!/usr/bin/env bash
# EXPERIMENTAL — build Presence.app on macOS. Requires Python 3 + Xcode CLT.
# (Untested in CI yet; the supported macOS path today is the launchd service
# running the agent, or `python3 presence_app.py`.)
set -euo pipefail
cd "$(dirname "$0")/.."

python3 -m pip install -r requirements-common.txt pyinstaller
python3 app/branding/make_icons.py

# assemble an .icns from the generated PNGs
SET=macos/Presence.iconset
rm -rf "$SET"; mkdir -p "$SET"
cp app/branding/icon_16.png   "$SET/icon_16x16.png"
cp app/branding/icon_32.png   "$SET/icon_16x16@2x.png"
cp app/branding/icon_32.png   "$SET/icon_32x32.png"
cp app/branding/icon_64.png   "$SET/icon_32x32@2x.png"
cp app/branding/icon_128.png  "$SET/icon_128x128.png"
cp app/branding/icon_256.png  "$SET/icon_128x128@2x.png"
cp app/branding/icon_256.png  "$SET/icon_256x256.png"
cp app/branding/icon_512.png  "$SET/icon_256x256@2x.png"
cp app/branding/icon_512.png  "$SET/icon_512x512.png"
cp app/branding/icon_1024.png "$SET/icon_512x512@2x.png"
iconutil -c icns "$SET" -o macos/Presence.icns

python3 -m PyInstaller --noconfirm --windowed --name Presence \
  --osx-bundle-identifier com.presence.app \
  --collect-all webview \
  --add-data "app/ui:app/ui" --add-data "app/branding:app/branding" \
  --add-data "themes:themes" --add-data "lib:lib" \
  --icon macos/Presence.icns \
  presence_app.py

echo "built: dist/Presence.app"
