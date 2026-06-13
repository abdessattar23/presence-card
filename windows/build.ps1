# windows/build.ps1 — build a single, no-terminal presence.exe.
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File windows\build.ps1
# Output: windows\dist\presence.exe (carries author/version metadata + icon)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Push-Location $root
try {
  python -m pip install -r requirements-windows.txt pyinstaller
  if ($LASTEXITCODE -ne 0) { throw "pip install failed ($LASTEXITCODE)" }

  # generate the khatim-star app icon + tray states from the single source
  python app\branding\make_icons.py
  if ($LASTEXITCODE -ne 0) { throw "icon generation failed ($LASTEXITCODE)" }

  # --icon and --version-file are resolved relative to --specpath, so pass them
  # as absolute paths to avoid a windows\windows\... mislookup.
  $icon = Join-Path $root "windows\icon.ico"
  $ver  = Join-Path $root "windows\version_info.txt"
  python -m PyInstaller --noconfirm `
    --noconsole --onefile --name presence `
    --collect-all winsdk `
    --icon "$icon" `
    --version-file "$ver" `
    --distpath windows\dist --workpath windows\build --specpath windows `
    presence_tray.py
  if ($LASTEXITCODE -ne 0) { throw "PyInstaller failed ($LASTEXITCODE)" }
  if (-not (Test-Path windows\dist\presence.exe)) { throw "presence.exe was not produced" }

  Write-Host "`nBuilt: $root\windows\dist\presence.exe"
} finally {
  Pop-Location
}
