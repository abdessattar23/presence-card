// api/logout.js — POST or GET /api/logout → clear session, back to home.
import { clearSession } from "../lib/auth.js";

export default function handler(req, res) {
  clearSession(res);
  res.statusCode = 302;
  res.setHeader("Location", "/");
  res.end();
}
