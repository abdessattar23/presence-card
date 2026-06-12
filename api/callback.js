// api/callback.js — GET /api/callback?code=&state= → finish GitHub OAuth.
import { checkState, setSession } from "../lib/auth.js";
import { upsertUser } from "../lib/store.js";

export default async function handler(req, res) {
  const { code, state } = req.query;
  if (!code || !checkState(req, state)) {
    res.statusCode = 400;
    return res.end("invalid oauth state");
  }
  try {
    // exchange code → access token
    const tokRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.APP_BASE_URL}/api/callback`,
      }),
    });
    const tok = await tokRes.json();
    if (!tok.access_token) {
      res.statusCode = 401;
      return res.end("oauth exchange failed");
    }
    // fetch the GitHub profile (we don't store the access token)
    const ghRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tok.access_token}`, "User-Agent": "presence-card" },
    });
    const gh = await ghRes.json();
    if (!gh || !gh.id) {
      res.statusCode = 401;
      return res.end("could not read GitHub profile");
    }
    const user = await upsertUser(gh);
    setSession(res, { gh_id: user.gh_id, handle: user.handle });
    res.statusCode = 302;
    res.setHeader("Location", user.handle ? "/dashboard" : "/onboard.html");
    res.end();
  } catch (e) {
    res.statusCode = 500;
    res.end("oauth error");
  }
}
