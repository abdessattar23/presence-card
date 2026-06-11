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

**Easiest:** grab `presence.exe` from the
[Releases page](https://github.com/abdessattar23/presence-card/releases) — it's
built by GitHub Actions on every version tag, so you don't need Python or a
toolchain at all. (You can also trigger a build yourself from the **Actions →
build windows exe → Run workflow** button and download it from the run's
artifacts.)

Or build it yourself:

```powershell
powershell -ExecutionPolicy Bypass -File windows\build.ps1
```

Out comes `windows\dist\presence.exe` — a self-contained, no-terminal app.
Double-click to run; it lands in the tray. Use **Run at login** in the menu
(or drop a shortcut in `shell:startup`) to have it start with Windows.

> First launch is a little slow (PyInstaller unpacks to a temp dir).

### Trust & signing

The exe carries proper **version metadata** — right-click → *Properties →
Details* shows the author (Mohammed Abdessetar Elyagoubi), product, version,
and MIT copyright instead of blank fields — and a real app icon. It's also
**reproducible**: anyone can rebuild it from this source with `build.ps1` and
the GitHub Actions workflow builds it in the open.

What metadata does **not** do is remove the SmartScreen prompt — only an
**Authenticode signature** from a code-signing certificate does that, and that
requires a paid cert (and reputation built over downloads). The build is
intentionally unsigned; to sign your own copy:

```powershell
signtool sign /fd SHA256 /a /tr http://timestamp.digicert.com /td SHA256 windows\dist\presence.exe
```

Until then, SmartScreen may warn on first run — *More info → Run anyway*. If you
don't want to trust a prebuilt binary at all, run option 2 (`pythonw`) or build
it yourself from source.

### Config

Same as the console agent: put your Upstash creds in `presence.config.json`
next to the exe/script, or set `PRESENCE_UPSTASH_URL` / `PRESENCE_UPSTASH_TOKEN`
in the environment. Set `PRESENCE_CARD_URL` to point "Open my card" at your own
deployment.
