// The original. Green phosphor CRT — scanlines, flicker, blinking block cursor.
import { MONO } from "../lib/motifs.js";

export default {
  name: "terminal", label: "Terminal",
  author: "presence core",
  description: "green phosphor CRT — scanlines and flicker",

  bg: "#05070a", panel: "#0a0f15", panel2: "#070a0e", border: "#15351f",
  text: "#39ff9e", dim: "#1f7a52",
  accent: "#ffb454", accentDim: "#7a5a26",
  ok: "#39ff9e", bad: "#ff5a5a",
  fontD: MONO, fontB: MONO, radius: 14, glow: true,

  strings: {
    brand: "PRESENCE", sub: "STATUS // LIVE",
    activityKey: "> ACTIVITY", playingKey: "> NOW PLAYING",
  },

  decor: (w, h, t) => `
    <defs><pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect y="3" width="4" height="1" fill="#000" fill-opacity=".28"/>
    </pattern></defs>
    <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="${t.radius}" fill="url(#scan)"/>`,

  web: {
    fontD: `"VT323",monospace`, fontB: `"IBM Plex Mono",monospace`,
    valSize: "30px", glow: "40%",
    css: `
      body::before{
        content:"";position:fixed;inset:0;pointer-events:none;z-index:5;
        background:repeating-linear-gradient(0deg,
          rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px,
          rgba(0,0,0,.18) 3px, rgba(0,0,0,.18) 4px);
        mix-blend-mode:multiply;
      }
      body::after{
        content:"";position:fixed;inset:0;pointer-events:none;z-index:6;
        box-shadow:inset 0 0 160px 40px rgba(0,0,0,.7);
        animation:flick 7s infinite steps(60);
      }
      @keyframes flick{0%,96%{opacity:.55}97%{opacity:.4}98%{opacity:.6}100%{opacity:.55}}
      .brand{font-family:var(--font-d);font-size:30px;letter-spacing:1px;color:var(--text);
        text-shadow:0 0 8px color-mix(in srgb, var(--text) var(--glow), transparent);line-height:1}
      .brand small{display:block;font-family:var(--font-b);font-size:10px;
        letter-spacing:3px;color:var(--dim);text-shadow:none;margin-top:2px}
      .val{font-weight:400}`,
  },
};
