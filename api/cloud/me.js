// api/me.js — GET /api/me → the signed-in user's profile + key metadata.
import { requireUser } from "../../lib/cloud/auth.js";
import { getUser } from "../../lib/cloud/store.js";

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
  const base = process.env.APP_BASE_URL || "";
  res.end(
    JSON.stringify({
      gh_id: user.gh_id,
      login: user.login,
      name: user.name,
      avatar: user.avatar,
      handle: user.handle,
      tier: user.tier,
      cardUrl: user.handle ? `${base}/u/${user.handle}` : null,
      keys: (user.keys || [])
        .filter((k) => !k.revoked)
        .map((k) => ({
          key_id: k.key_id,
          name: k.name,
          created_ts: k.created_ts,
          last_used_ts: k.last_used_ts || null,
        })),
    })
  );
}
