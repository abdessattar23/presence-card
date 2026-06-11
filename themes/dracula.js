// Dracula — the classic. Deep purple-grey panel, pink/cyan/purple accents,
// soft bat-wing glows in the corners.
import { MONO } from "../lib/motifs.js";

export default {
  name: "dracula", label: "Dracula",
  author: "presence core",
  description: "the classic — pink, cyan, purple on deep night",

  bg: "#21222c", panel: "#282a36", panel2: "#22232e", border: "#44475a",
  text: "#f8f8f2", dim: "#6272a4",
  accent: "#bd93f9", accentDim: "#6d5499", artist: "#8be9fd",
  ok: "#50fa7b", bad: "#ff5555",
  fontD: MONO, fontB: MONO, radius: 12, glow: true, minimal: true,

  decor: (w, h) => `
    <defs><filter id="drblur"><feGaussianBlur stdDeviation="36"/></filter></defs>
    <g filter="url(#drblur)">
      <circle cx="${w - 64}" cy="6" r="84" fill="#ff79c6" fill-opacity=".12"/>
      <circle cx="54" cy="${h - 6}" r="84" fill="#bd93f9" fill-opacity=".12"/>
    </g>`,

  web: {
    fontD: `"IBM Plex Mono",monospace`, fontB: `"IBM Plex Mono",monospace`,
    valSize: "25px", glow: "28%",
    swatch: ["#282a36", "#bd93f9"],
    css: `
      .panel{background-image:
        radial-gradient(150px 130px at 100% 0%, rgba(255,121,198,.14), transparent 70%),
        radial-gradient(150px 130px at 0% 100%, rgba(189,147,249,.14), transparent 70%),
        linear-gradient(180deg,var(--panel),var(--panel2))}`,
  },
};
