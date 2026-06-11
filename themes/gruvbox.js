// Gruvbox — warm retro. Dark0 background, that unmistakable amber/aqua/
// orange palette, a faint horizon glow. Easy on the eyes for long sessions.
import { MONO } from "../lib/motifs.js";

export default {
  name: "gruvbox", label: "Gruvbox",
  author: "presence core",
  description: "warm retro — amber, aqua, that cozy contrast",

  bg: "#1d2021", panel: "#282828", panel2: "#222425", border: "#504945",
  text: "#ebdbb2", dim: "#928374",
  accent: "#fabd2f", accentDim: "#7c6f42", artist: "#8ec07c",
  ok: "#b8bb26", bad: "#fb4934",
  fontD: MONO, fontB: MONO, radius: 10, glow: false, minimal: true,

  decor: (w, h) => `
    <defs><filter id="gbblur"><feGaussianBlur stdDeviation="30"/></filter></defs>
    <g filter="url(#gbblur)" opacity=".5">
      <ellipse cx="${w * 0.5}" cy="${h + 6}" rx="240" ry="36" fill="#fabd2f" fill-opacity=".14"/>
      <ellipse cx="${w * 0.8}" cy="${h + 10}" rx="160" ry="30" fill="#fe8019" fill-opacity=".12"/>
    </g>`,

  web: {
    fontD: `"IBM Plex Mono",monospace`, fontB: `"IBM Plex Mono",monospace`,
    valSize: "25px", glow: "0%",
    swatch: ["#282828", "#fabd2f"],
    css: `
      .panel{background-image:
        radial-gradient(260px 70px at 50% 100%, rgba(250,189,47,.16), transparent 75%),
        radial-gradient(200px 60px at 82% 100%, rgba(254,128,25,.12), transparent 75%),
        linear-gradient(180deg,var(--panel),var(--panel2))}`,
  },
};
