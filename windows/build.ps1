# windows/build.ps1 — build a single, no-terminal presence.exe.
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File windows\build.ps1
# Output: windows\dist\presence.exe (carries author/version metadata + icon)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Push-Location $root
try {
  python -m pip install -r requirements-windows.txt pyinstaller

  # generate the app icon (green phosphor dot) so the exe isn't the default blank
  python -c "from PIL import Image, ImageDraw; im=Image.new('RGBA',(256,256),(0,0,0,0)); ImageDraw.Draw(im).ellipse((38,38,218,218), fill=(57,255,158,255)); im.save('windows/icon.ico', sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])"

  python -m PyInstaller --noconfirm `
    --noconsole --onefile --name presence `
    --collect-all winsdk `
    --icon windows\icon.ico `
    --version-file windows\version_info.txt `
    --distpath windows\dist --workpath windows\build --specpath windows `
    presence_tray.py

  Write-Host "`nBuilt: $root\windows\dist\presence.exe"
} finally {
  Pop-Location
}
