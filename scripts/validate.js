// scripts/validate.js — `npm test`. Zero-dependency theme validation,
// run locally and by CI on every PR.

import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { themes, DEFAULT_THEME } from "../themes/index.js";
import { renderCard, DEMO_STATUS } from "../lib/card.js";

const COLOR_KEYS = ["bg", "panel", "panel2", "border", "text", "dim", "accent", "accentDim", "ok", "bad"];
const REQUIRED = [...COLOR_KEYS, "name", "label", "fontD", "fontB", "radius"];
const KNOWN_STRINGS = ["brand", "sub", "live", "away", "activityKey", "playingKey", "nothing", "awayActivity"];
const COLOR_RE = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

let failures = 0;
const fail = (theme, msg) => { failures++; console.error(`  ✗ [${theme}] ${msg}`); };

const themeDir = join(dirname(fileURLToPath(import.meta.url)), "..", "themes");
const files = readdirSync(themeDir).filter((f) => f.endsWith(".js") && !f.startsWith("_") && f !== "index.js");

// every theme file is registered, every registered theme has a file
for (const f of files) {
  const expect = f.replace(/\.js$/, "");
  if (!themes[expect]) fail(expect, `themes/${f} exists but is not registered in themes/index.js`);
}

for (const [key, t] of Object.entries(themes)) {
  if (key !== t.name) fail(key, `registry key "${key}" !== theme.name "${t.name}"`);
  if (!/^[a-z0-9-]+$/.test(t.name)) fail(key, `name must be kebab-case: "${t.name}"`);
  if (!files.includes(`${t.name}.js`)) fail(key, `no themes/${t.name}.js file (name must match filename)`);

  for (const k of REQUIRED)
    if (t[k] === undefined || t[k] === "") fail(key, `missing required token "${k}"`);
  for (const k of COLOR_KEYS)
    if (typeof t[k] === "string" && t[k].startsWith("#") && !COLOR_RE.test(t[k]))
      fail(key, `invalid hex color ${k}: "${t[k]}"`);
  if (t.artist && t.artist.startsWith("#") && !COLOR_RE.test(t.artist))
    fail(key, `invalid hex color artist: "${t.artist}"`);

  if (t.strings)
    for (const k of Object.keys(t.strings))
      if (!KNOWN_STRINGS.includes(k)) fail(key, `unknown strings key "${k}" (known: ${KNOWN_STRINGS.join(", ")})`);
  if (t.verbs)
    for (const [k, v] of Object.entries(t.verbs))
      if (typeof v !== "string") fail(key, `verbs.${k} must be a string`);

  if (!t.web || !t.web.fontD || !t.web.fontB)
    fail(key, `web.fontD and web.fontB are required (browser font stacks)`);

  // both card states must render clean
  for (const [state, status] of [["demo", DEMO_STATUS()], ["offline", { ts: 0 }]]) {
    try {
      const svg = renderCard(status, t);
      if (!svg.startsWith("<svg")) fail(key, `${state}: output is not an <svg>`);
      if (/\bundefined\b|\bNaN\b/.test(svg)) fail(key, `${state}: rendered SVG contains "undefined"/"NaN"`);
      const open = (svg.match(/</g) || []).length, close = (svg.match(/>/g) || []).length;
      if (open !== close) fail(key, `${state}: unbalanced angle brackets (${open} "<" vs ${close} ">")`);
    } catch (e) {
      fail(key, `${state}: render threw — ${e.message}`);
    }
  }
}

if (!themes[DEFAULT_THEME]) { failures++; console.error(`  ✗ DEFAULT_THEME "${DEFAULT_THEME}" is not registered`); }

const n = Object.keys(themes).length;
if (failures) {
  console.error(`\n${failures} problem(s) across ${n} theme(s).`);
  process.exit(1);
}
console.log(`✓ ${n} themes validated: ${Object.keys(themes).join(", ")}`);
