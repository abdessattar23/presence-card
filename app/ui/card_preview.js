// app/ui/card_preview.js — render the real card SVG locally for the preview,
// using the same renderer + themes the server uses. The bridge hands us the
// post-pipeline payload, so the preview reflects rules/privacy/overrides.
import { renderCard, DEMO_STATUS } from "../../lib/card.js";
import { getTheme } from "../../themes/index.js";

export function renderPreview(hostEl, themeName, payload) {
  const theme = getTheme(themeName);
  const status = payload && payload.activity ? payload : DEMO_STATUS();
  hostEl.innerHTML = renderCard(status, theme);
}
