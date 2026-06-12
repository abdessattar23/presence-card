// api/handle.js — POST /api/handle {handle} → claim or rename your handle.
import { requireUser, setSession } from "../../lib/cloud/auth.js";
import { claimHandle, validHandle, getUser } from "../../lib/cloud/store.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  const session = requireUser(req);
  if (!session) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: "not signed in" }));
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "method not allowed" }));
  }
  const handle = (req.body && req.body.handle ? String(req.body.handle) : "").toLowerCase();
  if (!validHandle(handle)) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "invalid handle (a-z, 0-9, -, 2-39 chars)" }));
  }
  const ok = await claimHandle(session.gh_id, handle);
  if (!ok) {
    res.statusCode = 409;
    return res.end(JSON.stringify({ error: "handle taken" }));
  }
  // refresh session so it carries the new handle
  setSession(res, { gh_id: session.gh_id, handle });
  const user = await getUser(session.gh_id);
  res.end(JSON.stringify({ ok: true, handle, cardUrl: `${process.env.APP_BASE_URL || ""}/u/${handle}` }));
}
