// lib/keys.js — API key minting + hashing.
//
// A raw key (pc_live_…) is shown to the user exactly once. We store only its
// SHA-256, so a database leak never exposes a usable key. Lookups hash the
// presented token and fetch apikey:{hash}.

import crypto from "node:crypto";

export function hashKey(raw) {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

/** Mint a new key. Returns { raw, hash, key_id }. */
export function mintKey() {
  const raw = "pc_live_" + crypto.randomBytes(24).toString("base64url");
  const hash = hashKey(raw);
  return { raw, hash, key_id: hash.slice(0, 8) };
}

/** Extract the bearer token from an Authorization header, or null. */
export function bearer(req) {
  const h = req.headers.authorization || req.headers.Authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1].trim() : null;
}
