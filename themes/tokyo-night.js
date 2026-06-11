// Tokyo Night — neon haze in the corners, and the footer rule is a
// cyan → violet → orange neon strip (replaces the plain hairline).
import { MONO } from "../lib/motifs.js";

export default {
  name: "tokyo-night", label: "Tokyo Night",
  author: "presence core",
  description: "neon city after the rain",

  bg: "#13141c", panel: "#1a1b26", panel2: "#16161e", border: "#2c2e40",
  text: "#c0caf5", dim: "#565f89",
  accent: "#ff9e64", accentDim: "#8a5b3e",
  ok: "#9ece6a", bad: "#f7768e",
  fontD: MONO, fontB: MONO, radius: 12, glow: true, minimal: true, footerRule: false,

  decor: (w, h) => `
    <defs>
      <linearGradient id="neon" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#7aa2f7"/><stop offset=".5" stop-color="#bb9af7"/><stop offset="1" stop-color="#ff9e64"/>
      </linearGradient>
      <filter id="blur34"><feGaussianBlur stdDeviation="34"/></filter>
    </defs>
    <circle cx="${w - 70}" cy="10" r="80" fill="#bb9af7" fill-opacity=".12" filter="url(#blur34)"/>
    <circle cx="60" cy="${h - 10}" r="80" fill="#7aa2f7" fill-opacity=".10" filter="url(#blur34)"/>
    <rect x="30" y="${h - 33}" width="${w - 60}" height="2" rx="1" fill="url(#neon)" opacity=".85"/>`,

  web: {
    fontD: `"IBM Plex Mono",monospace`, fontB: `"IBM Plex Mono",monospace`,
    valSize: "25px", glow: "30%",
    swatch: ["#1a1b26", "#7aa2f7"],
    css: `
      .panel{background-image:
        radial-gradient(160px 120px at 95% 0%, rgba(187,154,247,.14), transparent 70%),
        radial-gradient(160px 120px at 5% 100%, rgba(122,162,247,.12), transparent 70%),
        linear-gradient(180deg,var(--panel),var(--panel2))}
      .footer{border-top:2px solid;
        border-image:linear-gradient(90deg,#7aa2f7,#bb9af7,#ff9e64) 1}`,
  },
};
