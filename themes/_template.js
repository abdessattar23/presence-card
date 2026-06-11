// themes/_template.js — copy me to themes/<your-theme>.js and make it yours.
// (Files starting with "_" are ignored by the registry.)
//
// A theme is ONE object consumed by two renderers:
//   • the SVG card   →  /api/card?theme=yours   (GitHub READMEs)
//   • the web card   →  /?theme=yours           (portfolios, iframes)
//
// Workflow:
//   1. Copy this file, pick a kebab-case name.
//   2. Register it: add an import + list entry in themes/index.js.
//   3. Look at it:   npm run preview   → open previews/index.html
//   4. Validate it:  npm test
//   5. Open a PR with a screenshot. That's it.
//
// Tips: lib/motifs.js has reusable helpers (zellij mosaic tiles, rosettes,
// star fields, data-URI wrappers). See themes/sahara.js for a small worked
// example and themes/zellij.js for a maximal one.

import { MONO } from "../lib/motifs.js";
// import { SANS, svgWrap, dataUri, ... } from "../lib/motifs.js";

export default {
  // -- identity (required) ------------------------------------------------
  name: "my-theme",            // must match the filename, kebab-case
  label: "My Theme",           // shown in the card footer + README gallery
  author: "your-github-handle",
  description: "one line for the gallery",

  // -- palette (required) — all valid CSS colors --------------------------
  bg: "#0b0e14",               // page / outermost background
  panel: "#11151f",            // card top …
  panel2: "#0d1018",           // … to card bottom (vertical gradient)
  border: "#26304a",           // card border + rules
  text: "#e6e9f0",             // headline (the activity)
  dim: "#5d6b8a",              // brand, footer, secondary text
  accent: "#7dd3a8",           // track title, equalizer, verb label
  accentDim: "#3e6b54",        // [SPOTIFY] ▶ PLAYING line
  // artist: "#...",           // optional — artist name (defaults to dim)
  ok: "#7dd3a8",               // live dot when online
  bad: "#e06c75",              // live dot when offline

  // -- shape & type (required) --------------------------------------------
  fontD: MONO,                 // display font (SVG card: system stacks only)
  fontB: MONO,                 // body font
  radius: 12,                  // card corner radius
  glow: false,                 // soft glow behind headline / dot (SVG card)

  // -- options (all optional) ----------------------------------------------
  minimal: true,               // hide the small "> NOW PLAYING"-style labels
  // footerRule: false,        // suppress the footer hairline (draw your own)
  // bandWidth: 76,            // reserve a decorated column on the left
  // brandSize: 15,            // brand font size on the SVG card

  // -- copy (optional) — re-flavor or localize every label -----------------
  // strings: {
  //   brand: "presence", live: "LIVE", away: "OFFLINE",
  //   activityKey: "now", playingKey: "now playing",
  //   nothing: "nothing playing", awayActivity: "AWAY",
  // },
  // verbs: { coding: "...", listening: "...", browsing: "..." },

  // -- SVG decoration (optional) -------------------------------------------
  // Extra SVG drawn behind the text, clipped to the card. (w, h) is the
  // card size, t is this theme object. Patterns, gradients, filters — all
  // fine; keep ids unique-ish and never reference external resources.
  decor: (w, h, t) => ``,

  // -- web card (required: fontD/fontB; rest optional) ----------------------
  web: {
    fontD: `"IBM Plex Mono",monospace`,   // may use the Google Fonts loaded
    fontB: `"IBM Plex Mono",monospace`,   // in index.html (VT323, Reem Kufi…)
    valSize: "26px",                      // headline size
    glow: "0%",                           // glow strength, "0%"–"40%"
    // band: 76, bandImg: dataUri(...),   // left band fill (pairs with bandWidth)
    // swatch: ["#11151f", "#7dd3a8"],    // theme-switcher dot colors
    // Theme-scoped CSS injected while your theme is active. Style body,
    // .panel, .brand, .key, .val, .footer … — see other themes for ideas.
    css: ``,
  },
};
