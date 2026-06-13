# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims
to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] — 2026-06-13

### Added
- **Desktop app** (`presence_app.py`): a system-tray app with a pywebview
  control panel — Preview (the real card, live), Override ("fake status" with
  auto-clear), Rules, Privacy (hide editor/media, invisible, pause-on-apps),
  Appearance, and Account (cloud key or self-host). Backed by the shared
  `presence_core` Engine (detect → rules → publish). Windows exe builds and
  launches; macOS/Linux ship the runnable source (native build scripts are
  experimental).
- **New icon**: the khatim 8-point star with a live status dot, generated from
  one source (`app/branding/`) into the app, four tray states, and the favicon.
- **Privacy / rules / override engine** (`presence_rules.py`): per-app rules
  (relabel, hide, exclude, force-activity, redact-media), global privacy
  switches (hide editor/media, invisible, pause-on-apps), and manual status
  overrides ("fake status") with auto-expiry — resolved through one pipeline
  whose allow-list serializer guarantees only the four card fields ever leave
  the machine. 19 unit tests + a Python CI job. Config gains `rules`,
  `overrides`, `privacy`, `theme`, `autostart` sections (deep-merged, so
  existing configs are upgraded non-destructively).
- **Hosted cloud service (beta)**: sign in with GitHub, claim a handle, get an
  API key, and publish to `/api/ingest` — your card lives at `/u/{handle}`.
  GitHub OAuth, per-user isolation, server-side payload sanitization, and
  rate limiting; self-hosted bring-your-own-Upstash stays fully supported.
- **Agent cloud mode**: `presence_config` gains `api_key`/`api_base` +
  `creds_mode()`; agents publish to the cloud when an API key is set, else to
  Upstash. `python presence_agent.py --setup --api-key …` writes the config.
- **macOS & Linux release bundles**: CI now packages each platform's agent +
  config + service installer into a tarball and attaches it to the release,
  alongside the Windows `presence.exe`.

## [0.1.2] — 2026-06-12

### Added
- **Background services for macOS and Linux** — a launchd agent
  (`macos/install.sh`) and a `systemd --user` unit (`linux/install.sh`) so the
  agent runs at login with no terminal on every platform.
- **First-run setup dialog** (Windows): the agent/tray prompts for Upstash
  credentials on first launch and saves them, via the shared `presence_config`
  module.
- **Trustworthy exe**: the Windows build now embeds author/version metadata and
  an app icon (`windows/version_info.txt`), with signing guidance in the docs.

## [0.1.1] — 2026-06-11

### Added
- **Windows background app**: `presence_tray.py` runs the agent in the system
  tray (no console) with pause and a run-at-login toggle, and a PyInstaller
  build (`windows/build.ps1`) that produces a single `presence.exe`.
- **CI exe builds**: a GitHub Actions workflow builds `presence.exe` on a
  Windows runner and attaches it to every tagged release (also runnable on
  demand from the Actions tab).

## [0.1.0] — 2026-06-11

First public release.

### Added
- **Live presence card** in two forms from one renderer: an animated SVG
  (`/api/card`) for GitHub READMEs, and a web card (`index.html`) for
  portfolios and iframes (`?embed`).
- **15 themes**: terminal, zellij, riad, sahara, catppuccin, nord,
  tokyo-night, solarized, everforest, matrix, gruvbox, dracula, rose-pine,
  paper, gameboy — each a single file in `themes/`.
- **Theme contribution system**: one file per theme, a documented
  `_template.js`, shared motifs in `lib/motifs.js`, `npm test` validation,
  and an `npm run preview` gallery.
- **Desktop agents** for Windows, macOS, and Linux — coarse, privacy-safe
  status only (activity, app name, current track); window titles and
  filenames never leave the machine.
- **CI** validating every theme on each PR, plus issue templates and a PR
  checklist.

[Unreleased]: https://github.com/abdessattar23/presence-card/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/abdessattar23/presence-card/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/abdessattar23/presence-card/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/abdessattar23/presence-card/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/abdessattar23/presence-card/releases/tag/v0.1.0
