// Paper — field notes. Ruled lines, a red margin, the headline written
// straight onto the page. For light portfolios.
import { SANS } from "../lib/motifs.js";

export default {
  name: "paper", label: "Paper",
  author: "presence core",
  description: "ink on a clean page",

  bg: "#f6f2ea", panel: "#fffdf8", panel2: "#fbf8f0", border: "#d8d0c0",
  text: "#2b2620", dim: "#8a8175",
  accent: "#b3541e", accentDim: "#b8a48e",
  ok: "#2f7d4f", bad: "#b3372f",
  fontD: SANS, fontB: SANS, radius: 8, glow: false, minimal: true,

  strings: {
    live: "present", away: "away",
    nothing: "quiet", awayActivity: "away",
  },

  decor: (w, h) => {
    let lines = "";
    for (let y = 78; y < h - 24; y += 26)
      lines += `<line x1="20" y1="${y}" x2="${w - 20}" y2="${y}" stroke="#e7dfcd" stroke-width="1"/>`;
    return lines + `<line x1="24" y1="6" x2="24" y2="${h - 6}" stroke="#d98b7a" stroke-width="1.5" opacity=".6"/>`;
  },

  web: {
    fontD: `"IBM Plex Mono",monospace`, fontB: `"IBM Plex Mono",monospace`,
    valSize: "25px", glow: "0%",
    swatch: ["#fffdf8", "#b3541e"],
    css: `
      .panel{background-image:
        linear-gradient(90deg, transparent 23px, rgba(217,139,122,.55) 23px, rgba(217,139,122,.55) 24.5px, transparent 24.5px),
        repeating-linear-gradient(180deg, transparent 0 25px, #e7dfcd 25px 26px),
        linear-gradient(180deg,var(--panel),var(--panel2))}`,
  },
};
