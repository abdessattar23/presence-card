# Presence on Windows — background app

Three ways to run, lightest to nicest.

## 1. Console (quick test)

```powershell
pip install -r requirements-windows.txt
python presence_agent.py
```
A terminal stays open and prints what it publishes. Good for first setup.

## 2. Background, no terminal (no build)

```powershell
pythonw presence_tray.py
```
`pythonw` runs without a console. You get a **system-tray icon** with:

- live status line (current activity / track)
- **Paused** — stop publishing without quitting
- **Open my card** — opens your live web card
- **Run at login** — adds/removes an HKCU `Run` entry so it starts with Windows
- **Quit**

## 3. A single presence.exe (no Python needed)

Build it once:

```powershell
powershell -ExecutionPolicy Bypass -File windows\build.ps1
```

Out comes `windows\dist\presence.exe` — a self-contained, no-terminal app.
Double-click to run; it lands in the tray. Use **Run at login** in the menu
(or drop a shortcut in `shell:startup`) to have it start with Windows.

> First launch is a little slow (PyInstaller unpacks to a temp dir). The build
> is unsigned, so SmartScreen may warn the first time — "More info → Run
> anyway". Sign it with your own cert if you distribute it widely.

### Config

Same as the console agent: put your Upstash creds in `presence.config.json`
next to the exe/script, or set `PRESENCE_UPSTASH_URL` / `PRESENCE_UPSTASH_TOKEN`
in the environment. Set `PRESENCE_CARD_URL` to point "Open my card" at your own
deployment.
