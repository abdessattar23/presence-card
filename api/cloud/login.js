// api/login.js — GET /api/login → redirect to GitHub OAuth consent.
import { makeState } from "../../lib/cloud/auth.js";

export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const base = process.env.APP_BASE_URL;
  if (!clientId || !base) {
    res.statusCode = 500;
    return res.end("OAuth not configured");
  }
  const state = makeState(res); // also sets the signed state cookie
  const url =
    "https://github.com/login/oauth/authorize?" +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${base}/api/cloud/callback`,
      scope: "read:user",
      state,
    });
  res.statusCode = 302;
  res.setHeader("Location", url);
  res.end();
}
