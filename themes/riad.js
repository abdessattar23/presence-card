// The riad courtyard — zellij's sunlit sibling. Cream plaster, terracotta
// and cobalt tiles, the same rosette watermark in daylight.
import {
  SANS, mosaicPattern, mosaicTile, rosetteMotif, starfieldTile, svgWrap, dataUri,
} from "../lib/motifs.js";
import { ARABIC_VERBS, MOROCCAN_STR } from "./_moroccan.js";

const TILES = { grout: "#fdf6e7", field: "#e9dcc0", c1: "#c96a3b", c2: "#1f3a5f", c3: "#1f9e8e" };

export default {
  name: "riad", label: "Riad",
  author: "presence core",
  description: "the sunlit courtyard — cream plaster and tilework",

  bg: "#efe5d0", panel: "#fbf5e6", panel2: "#f6eeda", border: "#c98a3d",
  text: "#1f3a5f", dim: "#176b5e",
  accent: "#b95c2e", accentDim: "#c79a55", artist: "#9a4a22",
  ok: "#157a52", bad: "#b3372f",
  fontD: SANS, fontB: SANS, radius: 6, glow: false,
  bandWidth: 76, brandSize: 15,

  strings: MOROCCAN_STR,
  verbs: ARABIC_VERBS,

  decor: (w, h, t) => `
    <defs>${mosaicPattern("zm", TILES)}</defs>
    <rect x="2" y="2" width="${t.bandWidth}" height="${h - 4}" fill="url(#zm)"/>
    <line x1="${t.bandWidth + 3}" y1="2" x2="${t.bandWidth + 3}" y2="${h - 2}" stroke="#c98a3d" stroke-width="2"/>
    <line x1="${t.bandWidth + 7}" y1="2" x2="${t.bandWidth + 7}" y2="${h - 2}" stroke="#c98a3d" stroke-width="0.75"/>
    <g transform="translate(${w - 86},58)">${rosetteMotif("#1f3a5f", "0.08")}</g>`,

  web: {
    fontD: `"Reem Kufi","IBM Plex Mono",sans-serif`, fontB: `"IBM Plex Mono",monospace`,
    valSize: "27px", glow: "0%",
    band: 76, bandImg: dataUri(svgWrap(36, 36, mosaicTile(TILES))),
    swatch: ["#fbf5e6", "#b95c2e"],
    css: `
      body{background-image:${dataUri(svgWrap(64, 64, starfieldTile("#1f3a5f", ".07")))}}
      .panel{
        background-image:
          ${dataUri(svgWrap(190, 190, `<g transform="translate(95,95)">${rosetteMotif("#1f3a5f", ".08")}</g>`))},
          linear-gradient(180deg,var(--panel),var(--panel2));
        background-repeat:no-repeat;
        background-position:right -34px top -34px, 0 0;
      }
      .brand{font-size:15px;letter-spacing:2px}
      .key{font-size:14px}`,
  },
};
