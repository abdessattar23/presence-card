// lib/card.js — renders the presence card as a self-contained animated SVG.
//
// GitHub READMEs only allow images, so this is how the card lives there:
// a server-rendered SVG with inline CSS animations (pulse, equalizer,
// blinking cursor) and zero external resources — GitHub's camo proxy
// strips everything else. Respects prefers-reduced-motion.
//
// Layout philosophy: the status IS the headline. Small brand line, big
// activity, music below, one hairline before the footer. Decoration lives
// in each theme's decor() — tile bands, auroras, scanlines — never in
// extra labels.

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const clip = (s, n) => {
  s = String(s ?? "");
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
};

const ago = (sec) => {
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

const S = (t) => ({
  brand: "presence", live: "LIVE", away: "OFFLINE",
  activityKey: "now", playingKey: "now playing",
  nothing: "nothing playing", awayActivity: "AWAY",
  ...(t.strings || {}),
});

export function renderCard(status, theme, { staleSec = 90 } = {}) {
  const t = theme;
  const str = S(t);
  const W = 560, H = 252;
  const x0 = (t.bandWidth || 0) + 30;   // content left edge
  const x1 = W - 30;                    // content right edge

  const now = Math.floor(Date.now() / 1000);
  const age = status && status.ts ? now - status.ts : 9e9;
  const online = age < staleSec;

  // -- headline + label -------------------------------------------------
  const raw = online ? (status.activity || "idle").toLowerCase() : null;
  const verb = online && t.verbs && t.verbs[raw];
  const label = online ? (verb || str.activityKey) : str.activityKey;
  let head = online
    ? raw.toUpperCase() + (status.editor ? " — " + status.editor.toUpperCase() : "")
    : str.awayActivity;
  head = clip(head, t.bandWidth ? 25 : 29);

  // -- media -------------------------------------------------------------
  const m = online && status && status.media;
  const hasTrack = !!(m && m.title);
  const playing = hasTrack && !!m.playing;
  const track = hasTrack ? clip(m.title, t.bandWidth ? 30 : 36) : online ? str.nothing : "—";
  const artist = hasTrack ? clip(m.artist || "", 30) : "";
  const srcLine = hasTrack
    ? `${m.app ? "[" + String(m.app).toUpperCase() + "]" : ""} ${playing ? "▶ PLAYING" : "⏸ PAUSED"}`
    : "";

  const liveColor = online ? t.ok : t.bad;
  const liveText = online ? str.live : str.away;
  const synced = status && status.ts ? `synced ${ago(age)}` : "no signal";
  const artistColor = t.artist || t.dim;
  const glow = t.glow ? `filter="url(#soft)"` : "";

  const eqBars = [0, 1, 2, 3, 4]
    .map((i) => `<rect class="b b${i}" x="${i * 7}" y="0" width="4" height="30" rx="1" fill="${t.accent}"/>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="live presence: ${esc(head)}${hasTrack ? ", listening to " + esc(track) : ""}">
<style>
  .d{font-family:${t.fontD};} .b8{font-family:${t.fontB};}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
  .dot{animation:pulse 1.6s ease-in-out infinite}
  @keyframes eq{0%,100%{transform:scaleY(.28)}50%{transform:scaleY(1)}}
  .eq .b{transform-box:fill-box;transform-origin:50% 100%;animation:eq .9s ease-in-out infinite}
  .eq .b1{animation-delay:.15s}.eq .b2{animation-delay:.35s}.eq .b3{animation-delay:.55s}.eq .b4{animation-delay:.25s}
  .eq.paused .b{animation:none;transform:scaleY(.2);opacity:.5}
  @keyframes blink{50%{opacity:0}}
  .cursor{animation:blink 1.05s steps(1) infinite}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
<defs>
  <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${t.panel}"/><stop offset="1" stop-color="${t.panel2}"/>
  </linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="0" stdDeviation="2.2" flood-color="${t.text}" flood-opacity="0.4"/>
  </filter>
  <clipPath id="panelClip"><rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="${t.radius}"/></clipPath>
</defs>

<rect x="0" y="0" width="${W}" height="${H}" rx="${t.radius + 2}" fill="${t.bg}"/>
<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="${t.radius}" fill="url(#pg)" stroke="${t.border}" stroke-width="1.5"/>
<g clip-path="url(#panelClip)">${t.decor ? t.decor(W, H, t) : ""}</g>

<!-- brand + live -->
<text class="b8" x="${x0}" y="46" font-size="${t.brandSize || 12}" letter-spacing="2.5" fill="${t.dim}">${esc(str.brand)}</text>
<circle class="dot" cx="${x1 - 5}" cy="42" r="4.5" fill="${liveColor}" ${glow}/>
<text class="b8" x="${x1 - 18}" y="46" font-size="12" letter-spacing="2" text-anchor="end" fill="${liveColor}">${esc(liveText)}</text>

<!-- the headline: what's happening right now -->
<text class="b8" x="${x0}" y="100" font-size="13" letter-spacing="1.5" fill="${t.accent}">${esc(label)}</text>
<text class="d" x="${x0}" y="136" font-size="31" font-weight="700" fill="${t.text}" ${glow}>${esc(head)}<tspan class="cursor">▌</tspan></text>

<!-- now playing -->
<g class="eq ${playing ? "" : "paused"}" transform="translate(${x0},166)">${eqBars}</g>
${t.minimal ? "" : `<text class="b8" x="${x0 + 46}" y="172" font-size="10" letter-spacing="2" fill="${t.accentDim}">${esc(str.playingKey || "")}</text>`}
<text class="d" x="${x0 + 46}" y="${t.minimal ? 184 : 190}" font-size="19" font-weight="600" fill="${t.accent}">${esc(track)}</text>
<text class="b8" x="${x0 + 46}" y="${t.minimal ? 202 : 206}" font-size="12" fill="${artistColor}">${esc(artist)}${artist && srcLine ? "   " : ""}<tspan fill="${t.accentDim}" font-size="10" letter-spacing="1">${esc(srcLine)}</tspan></text>

<!-- footer -->
${t.footerRule === false ? "" : `<line x1="${x0}" y1="220" x2="${x1}" y2="220" stroke="${t.border}" stroke-width="1" opacity=".7"/>`}
<text class="b8" x="${x0}" y="238" font-size="10" letter-spacing="1" fill="${t.dim}">${esc(synced)}</text>
<text class="b8" x="${x1}" y="238" font-size="10" letter-spacing="1" text-anchor="end" fill="${t.dim}">${esc((t.label || t.name).toLowerCase())}</text>
</svg>`;
}

export const DEMO_STATUS = () => ({
  activity: "coding",
  editor: "VS Code",
  media: {
    title: "Fine Ghadi Biya Khouya",
    artist: "Nass El Ghiwane",
    playing: true,
    app: "Spotify",
  },
  ts: Math.floor(Date.now() / 1000),
});
