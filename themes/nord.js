// Nord — arctic calm with an aurora drifting across the top of the panel.
import { MONO } from "../lib/motifs.js";

export default {
  name: "nord", label: "Nord",
  author: "presence core",
  description: "arctic calm, aurora overhead",

  bg: "#242933", panel: "#2e3440", panel2: "#2b303b", border: "#434c5e",
  text: "#eceff4", dim: "#7b88a1",
  accent: "#88c0d0", accentDim: "#5e81ac",
  ok: "#a3be8c", bad: "#bf616a",
  fontD: MONO, fontB: MONO, radius: 10, glow: false, minimal: true,

  decor: (w, h) => `
    <defs><filter id="blur30"><feGaussianBlur stdDeviation="26"/></filter></defs>
    <g filter="url(#blur30)" opacity=".55">
      <ellipse cx="${w * 0.30}" cy="-8" rx="150" ry="30" fill="#88c0d0" fill-opacity=".30" transform="rotate(-6 ${w * 0.30} 0)"/>
      <ellipse cx="${w * 0.62}" cy="2" rx="160" ry="26" fill="#b48ead" fill-opacity=".24" transform="rotate(-4 ${w * 0.62} 0)"/>
      <ellipse cx="${w * 0.85}" cy="-6" rx="120" ry="22" fill="#a3be8c" fill-opacity=".18" transform="rotate(-7 ${w * 0.85} 0)"/>
    </g>`,

  web: {
    fontD: `"IBM Plex Mono",monospace`, fontB: `"IBM Plex Mono",monospace`,
    valSize: "25px", glow: "0%",
    swatch: ["#2e3440", "#88c0d0"],
    css: `
      .panel{background-image:
        radial-gradient(200px 60px at 28% 0%, rgba(136,192,208,.20), transparent 75%),
        radial-gradient(220px 55px at 62% 0%, rgba(180,142,173,.16), transparent 75%),
        radial-gradient(170px 50px at 88% 0%, rgba(163,190,140,.13), transparent 75%),
        linear-gradient(180deg,var(--panel),var(--panel2))}`,
  },
};
