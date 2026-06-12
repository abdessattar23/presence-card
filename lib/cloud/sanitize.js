// lib/sanitize.js — server-side privacy backstop for ingested presence.
//
// The agent already filters, but we never trust the client: the public card
// only ever shows {activity, editor, media{title,artist,playing,app}, ts}.
// Anything that looks like a window title, file path, or URL is dropped.

const MAX_BODY = 2048; // bytes

const looksLeaky = (s) =>
  /:\/\//.test(s) ||                  // URLs
  /[\\/][^\\/]+\.\w{1,5}\b/.test(s) || // path + file extension
  / [-—] [^-—]{3,}$/.test(s);          // "Foo.java - ProjectName" window-title tail

function cleanStr(s, max) {
  if (typeof s !== "string") return "";
  s = s.replace(/[\r\n\t]+/g, " ").trim();
  if (looksLeaky(s)) return "";
  return s.slice(0, max);
}

/**
 * Returns a sanitized payload, or null if the input is unusable/oversized.
 * `ts` is set by the server (never trust the client clock).
 */
export function sanitizePresence(rawBody) {
  if (typeof rawBody === "string" && Buffer.byteLength(rawBody, "utf8") > MAX_BODY) return null;

  let obj;
  try {
    obj = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
  } catch {
    return null;
  }
  if (!obj || typeof obj !== "object") return null;

  let activity = cleanStr(obj.activity, 24).toLowerCase();
  if (!/^[a-z ]{1,24}$/.test(activity)) activity = "idle";

  const editor = obj.editor == null ? null : cleanStr(obj.editor, 40) || null;

  let media = null;
  const m = obj.media;
  if (m && typeof m === "object" && m.title) {
    const title = cleanStr(m.title, 120);
    if (title) {
      media = {
        title,
        artist: cleanStr(m.artist, 80),
        playing: !!m.playing,
        app: cleanStr(m.app, 24),
      };
    }
  }

  return { activity, editor, media, ts: Math.floor(Date.now() / 1000) };
}
