// Matrix — wake up. Black, phosphor green, faint vertical rain behind the
// text. VT323 on the web card for full terminal flavor.
import { MONO } from "../lib/motifs.js";

export default {
  name: "matrix", label: "Matrix",
  author: "presence core",
  description: "digital rain — phosphor green on black",

  bg: "#000800", panel: "#001400", panel2: "#000a00", border: "#0b3d0b",
  text: "#39ff14", dim: "#1f7a1f",
  accent: "#9bff9b", accentDim: "#2f6f2f", artist: "#5cff5c",
  ok: "#39ff14", bad: "#ff5a5a",
  fontD: MONO, fontB: MONO, radius: 6, glow: true, minimal: true,

  decor: (w, h, t) => {
    let rain = "";
    // deterministic pseudo-streaks (no Math.random — keeps renders stable)
    const xs = [44, 96, 150, 214, 268, 322, 388, 432, 486, 524];
    xs.forEach((x, i) => {
      const len = 60 + ((i * 37) % 90);
      const top = (i * 53) % (h - 40);
      rain += `<rect x="${x}" y="${top}" width="2" height="${len}" fill="#39ff14" fill-opacity="${i % 3 === 0 ? 0.1 : 0.05}"/>`;
    });
    return `<defs><linearGradient id="mxfade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#39ff14" stop-opacity="0"/>
        <stop offset="1" stop-color="#39ff14" stop-opacity=".5"/>
      </linearGradient></defs>${rain}`;
  },

  web: {
    fontD: `"VT323",monospace`, fontB: `"IBM Plex Mono",monospace`,
    valSize: "30px", glow: "40%",
    swatch: ["#001400", "#39ff14"],
    css: `
      .panel{background-image:
        repeating-linear-gradient(90deg, transparent 0 52px,
          rgba(57,255,20,.04) 52px 54px),
        linear-gradient(180deg,var(--panel),var(--panel2))}
      .val{letter-spacing:1px}`,
  },
};
