// Sahara — desert dusk. A low sun, two dune ridges along the bottom.
// This theme was created from themes/_template.js as the worked example
// for CONTRIBUTING.md — copy it, recolor it, make it yours.
import { SANS, svgWrap, dataUri } from "../lib/motifs.js";

const dunes = (w, h) => `
  <circle cx="${w - 110}" cy="64" r="34" fill="#ff8c42" opacity=".22"/>
  <circle cx="${w - 110}" cy="64" r="46" fill="none" stroke="#ff8c42" stroke-opacity=".12"/>
  <path d="M0 ${h - 52} Q ${w * 0.25} ${h - 84} ${w * 0.5} ${h - 54} T ${w} ${h - 64} L ${w} ${h} L 0 ${h} Z"
    fill="#34200f"/>
  <path d="M0 ${h - 28} Q ${w * 0.3} ${h - 52} ${w * 0.62} ${h - 30} T ${w} ${h - 42} L ${w} ${h} L 0 ${h} Z"
    fill="#3f2813"/>`;

export default {
  name: "sahara", label: "Sahara",
  author: "presence core",
  description: "desert dusk — a low sun over the dunes",

  bg: "#1c1009", panel: "#2b1a0d", panel2: "#241509", border: "#7a4a23",
  text: "#f2dfc0", dim: "#b3835a",
  accent: "#ff8c42", accentDim: "#9c5a30", artist: "#d9a05b",
  ok: "#8fb96b", bad: "#d35e4c",
  fontD: SANS, fontB: SANS, radius: 10, glow: true, minimal: true,

  decor: (w, h) => dunes(w, h),

  web: {
    fontD: `"IBM Plex Mono",monospace`, fontB: `"IBM Plex Mono",monospace`,
    valSize: "26px", glow: "20%",
    swatch: ["#2b1a0d", "#ff8c42"],
    css: `
      body{background-image:radial-gradient(120% 80% at 70% 100%, #3a2110 0%, transparent 60%)}
      .panel{
        background-image:
          ${dataUri(svgWrap(560, 90, dunes(560, 90)))},
          linear-gradient(180deg,var(--panel),var(--panel2));
        background-repeat:no-repeat;
        background-position:bottom, 0 0;
        background-size:100% 90px, auto;
      }`,
  },
};
