// lib/store.js — user / handle / presence data access over Upstash.
//
// Canonical id is the GitHub numeric id (gh_id), which never changes. The
// handle is a renameable alias: handle:{handle} → gh_id. Presence is keyed by
// gh_id so a rename never orphans the card.

import { get, getRaw, set, del } from "./upstash.js";

const PRESENCE_TTL = 300; // seconds; agent heartbeat is 60s

const HANDLE_RE = /^[a-z0-9][a-z0-9-]{1,38}$/;
const RESERVED = new Set([
  "api", "u", "dashboard", "login", "logout", "callback", "me", "keys",
  "ingest", "status", "card", "admin", "onboard", "index", "favicon",
]);

export const userKey = (ghId) => `user:${ghId}`;
export const handleKey = (h) => `handle:${h.toLowerCase()}`;
export const presenceKey = (ghId) => `presence:${ghId}`;
export const apikeyKey = (hash) => `apikey:${hash}`;

export function validHandle(h) {
  return typeof h === "string" && HANDLE_RE.test(h) && !RESERVED.has(h.toLowerCase());
}

export async function getUser(ghId) {
  return get(userKey(ghId));
}

export async function saveUser(user) {
  await set(userKey(user.gh_id), user);
  return user;
}

/** Create or update a user from a GitHub profile, preserving handle + keys. */
export async function upsertUser(gh) {
  const existing = await getUser(gh.id);
  const user = existing || {
    gh_id: gh.id,
    handle: null,
    tier: "free",
    keys: [],
    created_ts: Math.floor(Date.now() / 1000),
  };
  user.login = gh.login;
  user.name = gh.name || gh.login;
  user.avatar = gh.avatar_url;
  await saveUser(user);
  return user;
}

/** Atomically claim a free handle for a user (or rename). Returns true on success. */
export async function claimHandle(ghId, handle) {
  handle = handle.toLowerCase();
  if (!validHandle(handle)) return false;
  const ok = await set(handleKey(handle), JSON.stringify({ gh_id: ghId }), { nx: true });
  if (!ok) return false;
  const user = await getUser(ghId);
  if (user) {
    if (user.handle && user.handle !== handle) await del(handleKey(user.handle));
    user.handle = handle;
    await saveUser(user);
  }
  return true;
}

/** Public read: handle → presence blob (or null). The API key is never involved. */
export async function getPresenceByHandle(handle) {
  if (!handle) return null;
  const ptr = await get(handleKey(handle));
  const ghId = ptr && ptr.gh_id;
  if (!ghId) return null;
  return get(presenceKey(ghId));
}

export async function writePresence(ghId, payload) {
  await set(presenceKey(ghId), payload, { ex: PRESENCE_TTL });
}

/** Resolve a presented API key hash → { gh_id, ... } or null (rejects revoked). */
export async function resolveApiKey(hash) {
  const rec = await get(apikeyKey(hash));
  if (!rec || rec.revoked) return null;
  return rec;
}
