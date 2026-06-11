// Catppuccin mocha — soft pastels, mauve and peach light blooming in
// opposite corners. Quiet card: no key labels.
import { MONO } from "../lib/motifs.js";

export default {
  name: "catppuccin", label: "Catppuccin",
  author: "presence core",
  description: "mocha — soft pastels for the comfy crowd",

  bg: "#11111b", panel: "#1e1e2e", panel2: "#181825", border: "#313244",
  text: "#cdd6f4", dim: "#6c7086",
  accent: "#fab387", accentDim: "#7c5c45",
  ok: "#a6e3a1", bad: "#f38ba8",
  fontD: MONO, fontB: MONO, radius: 16, glow: false, minimal: true,

  decor: (w, h) => `
    <defs><filter id="blur40"><feGaussianBlur stdDeviation="40"/></filter></defs>
    <g filter="url(#blur40)">
      <circle cx="${w - 60}" cy="0" r="90" fill="#cba6f7" fill-opacity=".14"/>
      <circle cx="40" cy="${h}" r="90" fill="#fab387" fill-opacity=".10"/>
    </g>`,

  web: {
    fontD: `"IBM Plex Mono",monospace`, fontB: `"IBM Plex Mono",monospace`,
    valSize: "25px", glow: "0%",
    swatch: ["#1e1e2e", "#cba6f7"],
    css: `
      .panel{background-image:
        radial-gradient(140px 140px at 100% 0%, rgba(203,166,247,.16), transparent 70%),
        radial-gradient(140px 140px at 0% 100%, rgba(250,179,135,.12), transparent 70%),
        linear-gradient(180deg,var(--panel),var(--panel2))}`,
  },
};
