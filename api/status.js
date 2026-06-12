// api/status.js — GET /api/status[?user=handle]
//
// Public read of the latest presence blob.
//   ?user=alice  → hosted cloud user's presence (resolved by handle)
//   (no param)   → legacy single global key — self-hosted / BYO-Upstash mode
//
// The API key is never involved in reads. Self-host env vars (unchanged):
//   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
import { get } from "../lib/upstash.js";
import { getPresenceByHandle } from "../lib/store.js";
import { limit, clientId } from "../lib/ratelimit.js";

const OFFLINE = { activity: "idle", editor: null, media: null, ts: 0 };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    await limit(["read", clientId(req)], 120, 60); // soft cap; never blocks reads hard
    const user = req.query.user;
    const status = user ? await getPresenceByHandle(user) : await get("presence");
    return res.status(200).json(status || OFFLINE);
  } catch {
    return res.status(200).json(OFFLINE);
  }
}
