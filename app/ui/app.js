// app/ui/app.js — control-panel logic. Talks to the Python bridge
// (window.pywebview.api) and renders the live card preview locally.
import { renderPreview } from "./card_preview.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
let state = null;

// pywebview injects the api asynchronously; wait for it.
function api() {
  return new Promise((res) => {
    if (window.pywebview && window.pywebview.api) return res(window.pywebview.api);
    window.addEventListener("pywebviewready", () => res(window.pywebview.api), { once: true });
  });
}
async function call(method, ...args) {
  const a = await api();
  state = await a[method](...args);
  paint();
  return state;
}

// tab switching
$$(".tab").forEach((t) =>
  t.addEventListener("click", () => {
    $$(".tab").forEach((x) => x.classList.toggle("on", x === t));
    $$(".view").forEach((v) => v.classList.toggle("on", v.dataset.view === t.dataset.view));
  })
);

function paint() {
  if (!state) return;
  document.body.dataset.theme = state.theme;
  $("#statusline").textContent = state.paused ? "paused"
    : (state.status && state.status.payload ? state.status.payload.activity : "…");
  $("#pauseBtn").textContent = state.paused ? "Resume" : "Pause";
  $("#cardUrl").textContent = state.card_url || "—";

  // preview
  const payload = state.status && state.status.payload;
  renderPreview($("#cardHost"), state.theme, payload);

  // override badge + fields
  const ov = state.overrides || {};
  $("#ovBadge").hidden = !ov.active;
  // privacy
  const p = state.privacy || {};
  $("#pInvisible").checked = !!p.invisible;
  $("#pHideEditor").checked = !!p.hide_editor;
  $("#pHideMedia").checked = !!p.hide_media;
  $("#pPlaceholder").value = p.idle_placeholder || "away";
  $("#pPause").value = (p.pause_on_apps || []).join(", ");
  // account
  $("#acMode").textContent = state.mode || "not configured";
  $("#acBase").value = state.api_base || "";
  // themes
  paintThemes();
  paintRules();
}

function paintThemes() {
  const grid = $("#themeGrid");
  grid.innerHTML = "";
  (state.themes || []).forEach((name) => {
    const el = document.createElement("div");
    el.className = "swatch" + (name === state.theme ? " on" : "");
    el.textContent = name;
    el.style.background = "var(--panel)";
    el.addEventListener("click", () => call("set_theme", name));
    grid.appendChild(el);
  });
}

function ruleRow(rule = {}) {
  const m = rule.match || {}, a = rule.action || {};
  const div = document.createElement("div");
  div.className = "rule";
  div.innerHTML = `
    <button class="x" title="remove">✕</button>
    <div class="grid">
      <div><label>when app contains</label><input class="r-app" value="${m.app || ""}" placeholder="code.exe"></div>
      <div><label>action</label>
        <select class="r-type">
          ${["relabel", "hide", "exclude", "force_activity", "redact_media"].map((t) =>
            `<option ${a.type === t ? "selected" : ""}>${t}</option>`).join("")}
        </select></div>
      <div><label>activity</label><input class="r-act" value="${a.activity || ""}" placeholder="deep work"></div>
      <div><label>label</label><input class="r-label" value="${a.label || ""}" placeholder=""></div>
    </div>`;
  div.querySelector(".x").addEventListener("click", () => div.remove());
  return div;
}
function paintRules() {
  const list = $("#ruleList");
  if (list.dataset.dirty) return; // don't clobber edits in progress
  list.innerHTML = "";
  (state.rules || []).forEach((r) => list.appendChild(ruleRow(r)));
}
function collectRules() {
  return $$("#ruleList .rule").map((d) => ({
    enabled: true,
    match: { app: d.querySelector(".r-app").value.trim() || null },
    action: {
      type: d.querySelector(".r-type").value,
      activity: d.querySelector(".r-act").value.trim() || null,
      label: d.querySelector(".r-label").value.trim() || null,
    },
  })).filter((r) => r.match.app);
}

// wire buttons
addEventListener("DOMContentLoaded", async () => {
  $("#pauseBtn").addEventListener("click", () => call("set_paused", !state.paused));
  $("#cardBtn").addEventListener("click", () => call("open_card"));

  $("#ovSave").addEventListener("click", () => {
    const title = $("#ovTitle").value.trim();
    const media = title ? { title, artist: $("#ovArtist").value.trim(), playing: true, app: "Spotify" } : null;
    call("set_override", $("#ovActivity").value.trim(), $("#ovEditor").value.trim() || null, media,
      Number($("#ovMinutes").value));
  });
  $("#ovClear").addEventListener("click", () => call("clear_override"));

  $("#addRule").addEventListener("click", () => { $("#ruleList").appendChild(ruleRow()); $("#ruleList").dataset.dirty = "1"; });
  $("#rulesSave").addEventListener("click", () => { delete $("#ruleList").dataset.dirty; call("save_rules", collectRules()); });

  $("#privSave").addEventListener("click", () => call("set_privacy", {
    invisible: $("#pInvisible").checked, hide_editor: $("#pHideEditor").checked,
    hide_media: $("#pHideMedia").checked, idle_placeholder: $("#pPlaceholder").value.trim() || "away",
    pause_on_apps: $("#pPause").value.split(",").map((s) => s.trim()).filter(Boolean),
  }));

  $("#acSave").addEventListener("click", () => call("set_account", $("#acKey").value, $("#acBase").value));
  $("#acUpstash").addEventListener("click", () => call("set_upstash", $("#acUrl").value, $("#acTok").value));
  $("#acDash").addEventListener("click", () => call("open_card"));

  await call("get_state");
});

// engine pushes status here each tick
window.__onStatus = (s) => { if (state) { state.status = s; paint(); } };
