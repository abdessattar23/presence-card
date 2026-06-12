// lib/ratelimit.js — fixed-window rate limiting on Upstash.
//
// One INCR + a one-time EXPIRE (NX) per window via a pipeline, so the TTL is
// set once and not reset on every hit. Boundary bursts (up to 2x at the window
// edge) are acceptable for v1; public reads also sit behind Vercel edge cache.

import crypto from "node:crypto";
import { pipeline } from "./upstash.js";

/** limit(["ingest", gh_id], 60, 60) → { ok, count } */
export async function limit(parts, max, windowSec) {
  const window = Math.floor(Date.now() / 1000 / windowSec);
  const key = `rl:${parts.join(":")}:${window}`;
  try {
    const res = await pipeline([
      ["INCR", key],
      ["EXPIRE", key, String(windowSec + 10), "NX"],
    ]);
    const count = (res && res[0] && res[0].result) || 0;
    return { ok: count <= max, count, retryAfter: windowSec };
  } catch {
    return { ok: true, count: 0, retryAfter: windowSec }; // fail-open on store error
  }
}

/** Stable, non-reversible per-client id from the forwarded IP. */
export function clientId(req) {
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "0";
  return crypto
    .createHash("sha256")
    .update(ip + (process.env.SESSION_SECRET || ""))
    .digest("hex")
    .slice(0, 16);
}
