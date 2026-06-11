<div align="center">

# حضور &nbsp;presence

**A tiny, self-hosted "what I'm doing right now" card — live from your desktop to your portfolio, your GitHub profile, anywhere an image or iframe fits.**

*Coding in Cursor? Listening to Nass El Ghiwane? Your visitors see it, live, in your style.*

[![license: MIT](https://img.shields.io/badge/license-MIT-2ea44f)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-e8b13c)](#-add-your-own-theme)
[![deploy with Vercel](https://img.shields.io/badge/deploy-vercel-black)](https://vercel.com/new)
[![themes](https://img.shields.io/badge/themes-8-1f9e8e)](#-themes)

<img src="https://YOUR-APP.vercel.app/api/card?theme=zellij&demo" alt="presence card, zellij theme" />

</div>

---

## How it works

```
┌─────────────┐   media session +    ┌─────────┐    ┌────────────────────────┐
│ your desktop │   focused app       │ Upstash │    │  /api/card  → SVG      │ → GitHub README
│ (agent .py)  │ ──────────────────▶ │ (redis) │ ─▶ │  /api/status → JSON    │
└─────────────┘   privacy-filtered   └─────────┘    │  index.html → web card │ → portfolio
                                                    └────────────────────────┘
```

A ~200-line Python agent reads the Windows media session (Spotify, YouTube in any
browser, VLC — one interface) and the focused app, then publishes a **coarse,
privacy-safe** status: `coding — Cursor`, the current track, nothing else.
Window titles and filenames **never leave your machine**.

## 🎨 Themes

Every theme ships twice: a **web card** (`index.html?theme=…`) and an **animated
SVG** (`/api/card?theme=…`) that works inside GitHub READMEs — pulsing live dot,
dancing equalizer, blinking cursor, all pure SVG/CSS, no JavaScript.

| theme | vibe |
|---|---|
| `zellij` ⭐ | Moroccan midnight — cobalt, a band of real khatim tilework, rosette watermark, bilingual عربي labels |
| `riad` | zellij's sunlit sibling — plaster cream courtyard, same tilework |
| `sahara` | desert dusk — a low sun over the dunes |
| `terminal` | the original — green phosphor CRT, scanlines and flicker |
| `catppuccin` | mocha — soft pastels for the comfy crowd |
| `nord` | arctic calm, aurora overhead |
| `tokyo-night` | neon city after the rain |
| `paper` | field notes — ruled lines, red margin |
| `gameboy` | DMG-01 — four shades of 1989, `POWER ON` |

Preview any theme without an agent running — append `&demo`:

```
https://YOUR-APP.vercel.app/api/card?theme=riad&demo
```

<div align="center">
<img src="https://YOUR-APP.vercel.app/api/card?theme=riad&demo" width="49%" />
<img src="https://YOUR-APP.vercel.app/api/card?theme=gameboy&demo" width="49%" />
</div>

## 🚀 Quick start

**1 · Storage (free):** create a database at [upstash.com](https://upstash.com),
grab the REST URL + token.

**2 · Deploy the card:** push this repo to GitHub → import in
[Vercel](https://vercel.com/new) → add env vars
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

**3 · Run the agent (Windows):**

```powershell
pip install winsdk pywin32 psutil requests
copy presence.config.example.json presence.config.json   # fill in your Upstash creds
python presence_agent.py
```

(Or skip the file and set `PRESENCE_UPSTASH_URL` / `PRESENCE_UPSTASH_TOKEN`
as environment variables. Secrets never live in the code.)

The agent only pushes on **change** plus a 60 s heartbeat — you'll stay far
under any free-tier limit.

## 📌 Put it places

**GitHub profile README** — the card is an animated SVG, so it just works:

```markdown
[![what I'm doing right now](https://YOUR-APP.vercel.app/api/card?theme=zellij)](https://your-site.com)
```

Light/dark aware:

```html
<picture>
  <source media="(prefers-color-scheme: dark)"
          srcset="https://YOUR-APP.vercel.app/api/card?theme=zellij">
  <img src="https://YOUR-APP.vercel.app/api/card?theme=riad"
       alt="what I'm doing right now">
</picture>
```

> GitHub proxies images through camo and may cache them for a minute or two —
> the card stays "live" within that.

**Portfolio / personal site** — iframe the web card (`?embed` strips the page
chrome and makes the background transparent):

```html
<iframe src="https://YOUR-APP.vercel.app/?theme=zellij&embed"
        width="600" height="330" frameborder="0" loading="lazy"
        title="live presence"></iframe>
```

Or roll your own UI against the JSON endpoint:

```
GET /api/status   →  {"activity":"coding","editor":"Cursor","media":{...},"ts":1718100000}
```

## 🧩 Add your own theme

A theme is **one file** that powers both cards (SVG + web):

```
cp themes/_template.js themes/yours.js   # every field documented inline
# register it in themes/index.js         (+1 import, +1 list entry)
npm run preview                          # local gallery: previews/index.html
npm test                                 # the same validation CI runs
```

Reusable motifs (zellij mosaic tiles, rosettes, star fields) live in
`lib/motifs.js`; `themes/sahara.js` is the small worked example. Full
walkthrough in [CONTRIBUTING.md](CONTRIBUTING.md).
**PRs for new themes are very welcome** — bring your culture, your console,
your colorscheme. zellij started as one person wanting their card to look
like home. 🇲🇦

## 🔒 Privacy

- Published: coarse activity (`coding` / `browsing` / …), app name (`Cursor`),
  current track + artist. That's the whole payload.
- **Never** published: window titles, filenames, URLs. They're read locally to
  classify activity and dropped.
- Set `PUBLISH_EDITOR = False` in the agent to hide even the app name.
- Kill the agent → card flips to offline (غائب) after 90 s.

## License

[MIT](LICENSE) — do whatever, just keep the notice.
