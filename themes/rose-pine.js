// Rosé Pine — soho vibes, muted and cozy. Pine/base background, rose and
// foam accents, a low rosy dawn glow along the top.
import { MONO } from "../lib/motifs.js";

export default {
  name: "rose-pine", label: "Rosé Pine",
  author: "presence core",
  description: "soho vibes — muted rose, foam, a rosy dawn",

  bg: "#191724", panel: "#1f1d2e", panel2: "#1a1826", border: "#403d52",
  text: "#e0def4", dim: "#6e6a86",
  accent: "#ebbcba", accentDim: "#8a6e6d", artist: "#9ccfd8",
  ok: "#31748f", bad: "#eb6f92",
  fontD: MONO, fontB: MONO, radius: 14, glow: false, minimal: true,

  decor: (w, h) => `
    <defs><filter id="rpblur"><feGaussianBlur stdDeviation="30"/></filter></defs>
    <g filter="url(#rpblur)" opacity=".6">
      <ellipse cx="${w * 0.35}" cy="-4" rx="170" ry="34" fill="#ebbcba" fill-opacity=".18"/>
      <ellipse cx="${w * 0.7}" cy="0" rx="160" ry="30" fill="#c4a7e7" fill-opacity=".15"/>
      <ellipse cx="${w * 0.92}" cy="-6" rx="120" ry="24" fill="#9ccfd8" fill-opacity=".12"/>
    </g>`,

  web: {
    fontD: `"IBM Plex Mono",monospace`, fontB: `"IBM Plex Mono",monospace`,
    valSize: "25px", glow: "0%",
    swatch: ["#1f1d2e", "#ebbcba"],
    css: `
      .panel{background-image:
        radial-gradient(190px 60px at 35% 0%, rgba(235,188,186,.18), transparent 75%),
        radial-gradient(200px 55px at 70% 0%, rgba(196,167,231,.15), transparent 75%),
        radial-gradient(150px 50px at 92% 0%, rgba(156,207,216,.12), transparent 75%),
        linear-gradient(180deg,var(--panel),var(--panel2))}`,
  },
};
