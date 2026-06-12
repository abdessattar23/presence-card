// api/cloud/whoami.js — GET /api/cloud/whoami  (Bearer API key)
// Lets the desktop app resolve its handle + card URL from the key alone
// (no browser session). Never returns anything secret.
import { bearer, hashKey } from "../../lib/cloud/keys.js";
import { resolveApiKey, getUser } from "../../lib/cloud/store.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  const token = bearer(req);
  if (!token) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: "missing key" }));
  }
  const rec = await resolveApiKey(hashKey(token));
  if (!rec) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: "invalid key" }));
  }
  const user = await getUser(rec.gh_id);
  const base = process.env.APP_BASE_URL || "";
  res.end(JSON.stringify({
    handle: user && user.handle ? user.handle : null,
    login: user ? user.login : null,
    card_url: user && user.handle ? `${base}/u/${user.handle}` : null,
  }));
}
