// Solarized Dark — Ethan Schoonover's precision palette. Teal-black base,
// yellow accent, cyan track, a faint blue depth glow.
import { MONO } from "../lib/motifs.js";

export default {
  name: "solarized", label: "Solarized",
  author: "presence core",
  description: "the precision classic — base03 teal, yellow + cyan",

  bg: "#002b36", panel: "#073642", panel2: "#052d37", border: "#194e5a",
  text: "#93a1a1", dim: "#586e75",
  accent: "#b58900", accentDim: "#6b5a1f", artist: "#2aa198",
  ok: "#859900", bad: "#dc322f",
  fontD: MONO, fontB: MONO, radius: 8, glow: false, minimal: true,

  decor: (w, h) => `
    <defs><filter id="slblur"><feGaussianBlur stdDeviation="34"/></filter></defs>
    <g filter="url(#slblur)" opacity=".5">
      <circle cx="${w - 60}" cy="8" r="80" fill="#268bd2" fill-opacity=".10"/>
      <circle cx="50" cy="${h - 8}" r="80" fill="#2aa198" fill-opacity=".09"/>
    </g>`,

  web: {
    fontD: `"IBM Plex Mono",monospace`, fontB: `"IBM Plex Mono",monospace`,
    valSize: "25px", glow: "0%",
    swatch: ["#073642", "#b58900"],
    css: `
      .panel{background-image:
        radial-gradient(150px 120px at 100% 0%, rgba(38,139,210,.12), transparent 70%),
        radial-gradient(150px 120px at 0% 100%, rgba(42,161,152,.10), transparent 70%),
        linear-gradient(180deg,var(--panel),var(--panel2))}`,
  },
};
