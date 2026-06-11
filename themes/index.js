// themes/index.js — the theme registry.
//
// Adding a theme? Two lines: import it, add it to the list. Keep the list
// alphabetical-ish (Moroccan originals first, guests after).

import terminal from "./terminal.js";
import zellij from "./zellij.js";
import riad from "./riad.js";
import sahara from "./sahara.js";
import catppuccin from "./catppuccin.js";
import nord from "./nord.js";
import paper from "./paper.js";
import tokyoNight from "./tokyo-night.js";
import gruvbox from "./gruvbox.js";
import dracula from "./dracula.js";
import rosePine from "./rose-pine.js";
import gameboy from "./gameboy.js";

const ALL = [
  terminal, zellij, riad, sahara,
  catppuccin, nord, tokyoNight, gruvbox, dracula, rosePine, paper, gameboy,
];

export const themes = Object.fromEntries(ALL.map((t) => [t.name, t]));

export const DEFAULT_THEME = "terminal";

export function getTheme(name) {
  return themes[name] || themes[DEFAULT_THEME];
}
