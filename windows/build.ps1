# windows/build.ps1 — build the Presence desktop app into a single exe.
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File windows\build.ps1
# Output: windows\dist\presence.exe  (system-tray app + control panel)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Push-Location $root
try {
  python -m pip install -r requirements-windows.txt pyinstaller
  if ($LASTEXITCODE -ne 0) { throw "pip install failed ($LASTEXITCODE)" }

  # khatim-star app icon + tray states from the single source
  python app\branding\make_icons.py
  if ($LASTEXITCODE -ne 0) { throw "icon generation failed ($LASTEXITCODE)" }

  # --add-data sources, like --icon/--version-file, resolve relative to
  # --specpath, so pass absolute source paths (dest stays relative).
  $icon = Join-Path $root "windows\icon.ico"
  $ver  = Join-Path $root "windows\version_info.txt"
  python -m PyInstaller --noconfirm `
    --noconsole --onefile --name presence `
    --collect-all winsdk --collect-all webview `
    --add-data "$root\app\ui;app/ui" `
    --add-data "$root\app\branding;app/branding" `
    --add-data "$root\themes;themes" `
    --add-data "$root\lib;lib" `
    --icon "$icon" `
    --version-file "$ver" `
    --distpath windows\dist --workpath windows\build --specpath windows `
    presence_app.py
  if ($LASTEXITCODE -ne 0) { throw "PyInstaller failed ($LASTEXITCODE)" }
  if (-not (Test-Path windows\dist\presence.exe)) { throw "presence.exe was not produced" }

  Write-Host "`nBuilt: $root\windows\dist\presence.exe"
} finally {
  Pop-Location
}
