# Contributing to presence

Themes are the heart of this project — bring your culture, your console,
your colorscheme. zellij started as one person wanting their status card to
look like home. 🇲🇦

## Add a theme in 10 minutes

A theme is **one file**. It powers both renderers at once: the animated SVG
card (`/api/card?theme=yours`, what GitHub READMEs show) and the web card
(`/?theme=yours`, what portfolios iframe).

```
1.  cp themes/_template.js themes/medina.js     # pick a kebab-case name
2.  edit themes/index.js                        # +1 import, +1 list entry
3.  npm run preview                             # renders previews/index.html
4.  npm test                                    # CI runs the same check
5.  open a PR with a screenshot
```

No dependencies to install — `npm test` and `npm run preview` are plain
Node ≥ 18 scripts.

### Anatomy of a theme

Open [`themes/_template.js`](themes/_template.js) — every field is
documented inline. The short version:

| part | what it controls |
|---|---|
| palette tokens (`bg`, `panel`, `text`, `accent`, …) | both cards |
| `decor(w, h, t)` | extra SVG painted behind the text on the SVG card — patterns, gradients, filters |
| `strings` / `verbs` | every label, re-flavorable or localizable (zellij says **حاضر** instead of LIVE; gameboy says **POWER ON**) |
| `web.css` | theme-scoped CSS injected into the web card while active |
| `minimal`, `bandWidth`, `footerRule`, … | layout switches |

Reusable motifs (the zellij mosaic tiles, rosettes, star fields, data-URI
helpers) live in [`lib/motifs.js`](lib/motifs.js).

**Worked examples**, simplest to fanciest:
[`sahara`](themes/sahara.js) (palette + one decor) →
[`nord`](themes/nord.js) (aurora, minimal labels) →
[`gameboy`](themes/gameboy.js) (custom strings) →
[`zellij`](themes/zellij.js) (band, motifs, bilingual labels).

### Design notes

- The SVG card must be **self-contained**: no external fonts, images, or
  scripts — GitHub's image proxy strips them. System font stacks only
  (`lib/motifs.js` exports `MONO` and `SANS`). The web card *can* use the
  Google Fonts loaded in `index.html` via `web.fontD`/`web.fontB`.
- Check **both states** — the offline card (toggle in the preview gallery)
  is what visitors see most of the time.
- Animations come free (pulse, equalizer, cursor). If you add your own,
  respect `prefers-reduced-motion` like the base card does.
- Contrast: `dim` on `panel` should still be readable; that's the footer.

### Review

CI validates every theme (tokens, colors, both render states). Vercel
builds each PR, so reviewers get a live preview at
`<preview-url>/api/card?theme=yours&demo` — mention your theme name in the
PR description.

## Non-theme contributions

Agents for other platforms (macOS/Linux equivalents of
`presence_agent.py`), backends, and renderer improvements are all welcome —
open an issue first for anything structural. Two hard rules:

1. **Privacy is the product**: nothing beyond coarse activity, app name,
   and track may ever be published. Window titles and filenames stay local.
2. **Zero runtime dependencies** stays true for the card + scripts.
