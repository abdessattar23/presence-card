# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims
to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Windows background app**: `presence_tray.py` runs the agent in the system
  tray (no console) with pause and a run-at-login toggle, and a PyInstaller
  build (`windows/build.ps1`) that produces a single `presence.exe`.

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

[Unreleased]: https://github.com/abdessattar23/presence-card/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/abdessattar23/presence-card/releases/tag/v0.1.0
