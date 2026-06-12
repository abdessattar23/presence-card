// lib/upstash.js — tiny Upstash Redis REST client (zero deps).
//
// Centralizes the fetch + Bearer pattern that api/status.js and api/card.js
// used inline. Reads creds from the Vercel env (UPSTASH_REDIS_REST_URL /
// UPSTASH_REDIS_REST_TOKEN). All values are JSON strings by convention.

const URL = (process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const H = { Authorization: `Bearer ${TOKEN}` };

function assertConfigured() {
  if (!URL || !TOKEN) throw new Error("Upstash env not configured");
}

/** GET key → parsed JSON value, or null if missing. */
export async function get(key) {
  assertConfigured();
  const r = await fetch(`${URL}/get/${encodeURIComponent(key)}`, { headers: H });
  const data = await r.json();
  if (!data || data.result == null) return null;
  try {
    return JSON.parse(data.result);
  } catch {
    return data.result; // plain string value (e.g. handle → gh_id pointer)
  }
}

/** GET raw string (no JSON.parse). */
export async function getRaw(key) {
  assertConfigured();
  const r = await fetch(`${URL}/get/${encodeURIComponent(key)}`, { headers: H });
  const data = await r.json();
  return data && data.result != null ? data.result : null;
}

/**
 * SET key = value (objects are JSON-stringified). opts:
 *   { ex: seconds }  → TTL,  { nx: true } → only if absent (returns ok bool).
 */
export async function set(key, value, opts = {}) {
  assertConfigured();
  const body = typeof value === "string" ? value : JSON.stringify(value);
  const qs = new URLSearchParams();
  if (opts.ex) qs.set("EX", String(opts.ex));
  if (opts.nx) qs.set("NX", "true");
  const q = qs.toString();
  const r = await fetch(`${URL}/set/${encodeURIComponent(key)}${q ? "?" + q : ""}`, {
    method: "POST",
    headers: H,
    body,
  });
  const data = await r.json();
  // NX returns null result when the key already existed
  return opts.nx ? data.result === "OK" : true;
}

export async function del(key) {
  assertConfigured();
  await fetch(`${URL}/del/${encodeURIComponent(key)}`, { method: "POST", headers: H });
}

/** Run a Redis command pipeline, e.g. pipeline([["INCR","k"],["EXPIRE","k","70","NX"]]). */
export async function pipeline(commands) {
  assertConfigured();
  const r = await fetch(`${URL}/pipeline`, {
    method: "POST",
    headers: H,
    body: JSON.stringify(commands),
  });
  return r.json(); // [{result}, {result}, ...]
}
