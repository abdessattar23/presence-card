// api/card.js — GET /api/card?theme=zellij[&demo]
//
// Serves the presence card as an animated SVG, ready to drop into a GitHub
// profile README:
//
//   [![presence](https://presence-neon.vercel.app/api/card?theme=zellij)](https://your-site.com)
//
// `&demo` returns sample data; `?user=alice` serves a hosted cloud user's card
// (resolved by public handle — the API key is never involved). With no `user`
// it reads the legacy single global key (self-hosted / BYO-Upstash mode).
// Note: GitHub proxies images through camo, which may cache for a couple of
// minutes; the short s-maxage below keeps it as fresh as camo allows.

import { getTheme, DEFAULT_THEME, themes } from "../themes/index.js";
import { renderCard, DEMO_STATUS } from "../lib/card.js";
import { get } from "../lib/upstash.js";
import { getPresenceByHandle } from "../lib/cloud/store.js";
import { limit, clientId } from "../lib/ratelimit.js";

export default async function handler(req, res) {
  const name = (req.query.theme || DEFAULT_THEME).toLowerCase();
  const theme = getTheme(name);

  let status = null;
  if ("demo" in req.query) {
    status = DEMO_STATUS();
  } else {
    try {
      await limit(["read", clientId(req)], 120, 60);
      const user = req.query.user;
      status = user ? await getPresenceByHandle(user) : await get("presence");
    } catch {
      status = null;
    }
  }

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=10, stale-while-revalidate=30");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Available-Themes", Object.keys(themes).join(", "));
  return res.status(200).send(renderCard(status, theme));
}
