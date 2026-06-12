// api/ingest.js — POST /api/ingest  (the agent's authenticated write path).
//
//   Authorization: Bearer pc_live_…
//   body: presence JSON {activity, editor, media, ts}
//
// Resolves the key → user, rate-limits, sanitizes (server never trusts the
// client), and writes presence:{gh_id} with a TTL. The key never appears in
// any public read path.
import { bearer, hashKey } from "../../lib/cloud/keys.js";
import { resolveApiKey, writePresence } from "../../lib/cloud/store.js";
import { sanitizePresence } from "../../lib/cloud/sanitize.js";
import { limit } from "../../lib/ratelimit.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "method not allowed" }));
  }

  const token = bearer(req);
  if (!token) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: "missing bearer key" }));
  }

  const len = Number(req.headers["content-length"] || 0);
  if (len > 2048) {
    res.statusCode = 413;
    return res.end(JSON.stringify({ error: "payload too large" }));
  }

  const rec = await resolveApiKey(hashKey(token));
  if (!rec) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: "invalid key" }));
  }

  const rl = await limit(["ingest", rec.gh_id], 60, 60);
  if (!rl.ok) {
    res.statusCode = 429;
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.end(JSON.stringify({ error: "rate limited" }));
  }

  const clean = sanitizePresence(req.body);
  if (!clean) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "bad payload" }));
  }

  await writePresence(rec.gh_id, clean);
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true }));
}
