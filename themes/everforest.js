// Everforest — soft, warm, low-contrast forest. Muted green base, sage
// accent, a quiet green glow rising from the floor.
import { MONO } from "../lib/motifs.js";

export default {
  name: "everforest", label: "Everforest",
  author: "presence core",
  description: "soft warm forest — sage green, low contrast",

  bg: "#2d353b", panel: "#343f44", panel2: "#2f393e", border: "#4a555b",
  text: "#d3c6aa", dim: "#859289",
  accent: "#a7c080", accentDim: "#5d6f4a", artist: "#7fbbb3",
  ok: "#a7c080", bad: "#e67e80",
  fontD: MONO, fontB: MONO, radius: 12, glow: false, minimal: true,

  decor: (w, h) => `
    <defs><filter id="efblur"><feGaussianBlur stdDeviation="30"/></filter></defs>
    <g filter="url(#efblur)" opacity=".5">
      <ellipse cx="${w * 0.4}" cy="${h + 4}" rx="220" ry="34" fill="#a7c080" fill-opacity=".14"/>
      <ellipse cx="${w * 0.82}" cy="${h + 8}" rx="150" ry="28" fill="#83c092" fill-opacity=".11"/>
    </g>`,

  web: {
    fontD: `"IBM Plex Mono",monospace`, fontB: `"IBM Plex Mono",monospace`,
    valSize: "25px", glow: "0%",
    swatch: ["#343f44", "#a7c080"],
    css: `
      .panel{background-image:
        radial-gradient(240px 70px at 40% 100%, rgba(167,192,128,.16), transparent 75%),
        radial-gradient(180px 60px at 82% 100%, rgba(131,192,146,.12), transparent 75%),
        linear-gradient(180deg,var(--panel),var(--panel2))}`,
  },
};
