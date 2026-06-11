// DMG-01 — four shades of 1989. Pixel grid, shell-grey bezel,
// DOT MATRIX WITH STEREO SOUND.
import { MONO } from "../lib/motifs.js";

export default {
  name: "gameboy", label: "Game Boy",
  author: "presence core",
  description: "four shades of 1989 — POWER ON",

  bg: "#9a96a8", panel: "#9bbc0f", panel2: "#8bac0f", border: "#0f380f",
  text: "#0f380f", dim: "#306230",
  accent: "#0f380f", accentDim: "#306230",
  ok: "#0f380f", bad: "#306230",
  fontD: MONO, fontB: MONO, radius: 8, glow: false,

  strings: {
    brand: "PRESENCE", sub: "GAME PAK · v1.0",
    live: "POWER ON", away: "POWER OFF",
    activityKey: "> CURRENT QUEST", playingKey: "> SOUNDTRACK",
    nothing: "no music inserted", awayActivity: "GAME OVER",
  },

  decor: (w, h, t) => `
    <defs><pattern id="px" width="3" height="3" patternUnits="userSpaceOnUse">
      <rect x="2" y="2" width="1" height="1" fill="#0f380f" fill-opacity=".07"/>
    </pattern></defs>
    <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="${t.radius}" fill="url(#px)"/>
    <text x="${w / 2}" y="16" font-size="8" letter-spacing="2" text-anchor="middle"
      fill="#306230" font-family="${t.fontB}">DOT MATRIX WITH STEREO SOUND</text>`,

  web: {
    fontD: `"VT323",monospace`, fontB: `"VT323",monospace`,
    valSize: "30px", glow: "0%",
    swatch: ["#9bbc0f", "#0f380f"],
    css: `
      .panel{border-width:4px;
        box-shadow:0 0 0 8px #8d899c, 0 0 0 9px #5a5666, 0 24px 60px -24px rgba(0,0,0,.55)}
      .brand{font-family:var(--font-d);font-size:30px;letter-spacing:1px;color:var(--text);line-height:1}
      .brand small{display:block;font-family:var(--font-b);font-size:10px;
        letter-spacing:3px;color:var(--dim);margin-top:2px}
      .val{font-weight:400}
      .key{font-size:16px;letter-spacing:1px}
      .media .key{font-size:14px}
      .live{font-size:15px}
      .footer{font-size:14px}`,
  },
};
