// api/keys.js — API key management for the signed-in user.
//   GET    /api/keys            → list (metadata only)
//   POST   /api/keys {name}     → mint a key, returns the raw value ONCE
//   DELETE /api/keys?key_id=…   → revoke
import { requireUser } from "../lib/auth.js";
import { getUser, saveUser, apikeyKey } from "../lib/store.js";
import { mintKey } from "../lib/keys.js";
import { set, del } from "../lib/upstash.js";
import { limit } from "../lib/ratelimit.js";

const MAX_ACTIVE = 5;

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  const session = requireUser(req);
  if (!session) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: "not signed in" }));
  }
  const user = await getUser(session.gh_id);
  if (!user) {
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: "user not found" }));
  }
  user.keys = user.keys || [];

  if (req.method === "GET") {
    return res.end(JSON.stringify({ keys: user.keys.filter((k) => !k.revoked) }));
  }

  if (req.method === "POST") {
    const active = user.keys.filter((k) => !k.revoked);
    if (active.length >= MAX_ACTIVE) {
      res.statusCode = 409;
      return res.end(JSON.stringify({ error: "too many active keys" }));
    }
    const rl = await limit(["keygen", user.gh_id, "day"], 10, 86400);
    if (!rl.ok) {
      res.statusCode = 429;
      return res.end(JSON.stringify({ error: "key creation rate limited" }));
    }
    const name = (req.body && req.body.name) || "default";
    const k = mintKey();
    await set(apikeyKey(k.hash), { gh_id: user.gh_id, key_id: k.key_id, revoked: false });
    user.keys.push({
      key_id: k.key_id,
      name: String(name).slice(0, 40),
      hash: k.hash,
      created_ts: Math.floor(Date.now() / 1000),
      revoked: false,
    });
    await saveUser(user);
    return res.end(JSON.stringify({ key_id: k.key_id, raw: k.raw })); // shown once
  }

  if (req.method === "DELETE") {
    const keyId = req.query.key_id;
    const entry = user.keys.find((k) => k.key_id === keyId && !k.revoked);
    if (!entry) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: "key not found" }));
    }
    await del(apikeyKey(entry.hash));
    entry.revoked = true;
    await saveUser(user);
    return res.end(JSON.stringify({ ok: true }));
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: "method not allowed" }));
}
