// زليج — Moroccan midnight. A band of real tilework down the left edge:
// filled khatim stars, terracotta diamonds, cream grout. A sixteen-fold
// rosette watermark floats in the headline whitespace. Bilingual labels.
import {
  SANS, mosaicPattern, mosaicTile, rosetteMotif, starfieldTile, svgWrap, dataUri,
} from "../lib/motifs.js";
import { ARABIC_VERBS, MOROCCAN_STR } from "./_moroccan.js";

const TILES = { grout: "#ead9b8", field: "#14306b", c1: "#e8b13c", c2: "#1f9e8e", c3: "#c96a3b" };

export default {
  name: "zellij", label: "Zellij",
  author: "presence core",
  description: "Moroccan midnight — cobalt, khatim stars, a band of tilework 🇲🇦",

  bg: "#081733", panel: "#0e2348", panel2: "#0a1b3a", border: "#8a6128",
  text: "#f3e9d2", dim: "#3fae97",
  accent: "#e8b13c", accentDim: "#a8773a", artist: "#d97e4a",
  ok: "#19b58f", bad: "#e06550",
  fontD: SANS, fontB: SANS, radius: 6, glow: true,
  bandWidth: 76, brandSize: 15,

  strings: MOROCCAN_STR,
  verbs: ARABIC_VERBS,

  decor: (w, h, t) => `
    <defs>${mosaicPattern("zm", TILES)}</defs>
    <rect x="2" y="2" width="${t.bandWidth}" height="${h - 4}" fill="url(#zm)"/>
    <line x1="${t.bandWidth + 3}" y1="2" x2="${t.bandWidth + 3}" y2="${h - 2}" stroke="#8a6128" stroke-width="2"/>
    <line x1="${t.bandWidth + 7}" y1="2" x2="${t.bandWidth + 7}" y2="${h - 2}" stroke="#8a6128" stroke-width="0.75"/>
    <g transform="translate(${w - 86},58)">${rosetteMotif("#e8b13c", "0.10")}</g>`,

  web: {
    fontD: `"Reem Kufi","IBM Plex Mono",sans-serif`, fontB: `"IBM Plex Mono",monospace`,
    valSize: "27px", glow: "25%",
    band: 76, bandImg: dataUri(svgWrap(36, 36, mosaicTile(TILES))),
    swatch: ["#14306b", "#e8b13c"],
    css: `
      body{background-image:${dataUri(svgWrap(64, 64, starfieldTile("#e8b13c", ".06")))}}
      .panel{
        background-image:
          ${dataUri(svgWrap(190, 190, `<g transform="translate(95,95)">${rosetteMotif("#e8b13c", ".1")}</g>`))},
          linear-gradient(180deg,var(--panel),var(--panel2));
        background-repeat:no-repeat;
        background-position:right -34px top -34px, 0 0;
      }
      .brand{font-size:15px;letter-spacing:2px}
      .key{font-size:14px}`,
  },
};
