# windows/build.ps1 — build a single, no-terminal presence.exe.
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File windows\build.ps1
# Output: windows\dist\presence.exe

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Push-Location $root
try {
  python -m pip install -r requirements-windows.txt pyinstaller
  python -m PyInstaller --noconfirm `
    --noconsole --onefile --name presence `
    --collect-all winsdk `
    --distpath windows\dist --workpath windows\build --specpath windows `
    presence_tray.py
  Write-Host "`nBuilt: $root\windows\dist\presence.exe"
} finally {
  Pop-Location
}
