// lib/auth.js — stateless signed sessions + OAuth CSRF state (zero deps).
//
// No session store: a session is a cookie `payload.hmac` signed with
// SESSION_SECRET. Serverless-friendly — the login and callback lambdas don't
// need to share memory. OAuth `state` is signed the same way.

import crypto from "node:crypto";

const SECRET = process.env.SESSION_SECRET || "";
const SESSION_COOKIE = "presence_session";
const STATE_COOKIE = "presence_oauth";
const SESSION_TTL = 30 * 24 * 3600; // 30 days
const STATE_TTL = 600;              // 10 min

const b64 = (s) => Buffer.from(s).toString("base64url");
const unb64 = (s) => Buffer.from(s, "base64url").toString();

function hmac(data) {
  return crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
}

function eq(a, b) {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/** Sign an arbitrary payload object → "b64(json).hmac". */
export function sign(payload) {
  const body = b64(JSON.stringify(payload));
  return `${body}.${hmac(body)}`;
}

/** Verify a signed token → payload object, or null. */
export function verifyToken(token) {
  if (!token || !SECRET) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const body = token.slice(0, dot), mac = token.slice(dot + 1);
  if (!eq(mac, hmac(body))) return null;
  try {
    return JSON.parse(unb64(body));
  } catch {
    return null;
  }
}

// ---- cookies -------------------------------------------------------------
export function parseCookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function cookie(name, value, maxAge) {
  return `${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

// ---- sessions ------------------------------------------------------------
export function setSession(res, { gh_id, handle }) {
  const now = Math.floor(Date.now() / 1000);
  const token = sign({ gh_id, handle, iat: now, exp: now + SESSION_TTL });
  res.setHeader("Set-Cookie", cookie(SESSION_COOKIE, token, SESSION_TTL));
}

export function clearSession(res) {
  res.setHeader("Set-Cookie", cookie(SESSION_COOKIE, "", 0));
}

/** Returns the session payload if valid + unexpired, else null. */
export function requireUser(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  const p = verifyToken(token);
  if (!p) return null;
  if (p.exp && p.exp < Math.floor(Date.now() / 1000)) return null;
  return p;
}

// ---- OAuth state ---------------------------------------------------------
export function makeState(res) {
  const nonce = crypto.randomBytes(16).toString("base64url");
  const token = sign({ nonce, iat: Math.floor(Date.now() / 1000) });
  res.setHeader("Set-Cookie", cookie(STATE_COOKIE, token, STATE_TTL));
  return token;
}

export function checkState(req, stateParam) {
  const cookieState = parseCookies(req)[STATE_COOKIE];
  if (!cookieState || !stateParam || !eq(cookieState, stateParam)) return false;
  const p = verifyToken(stateParam);
  if (!p) return false;
  return Math.floor(Date.now() / 1000) - (p.iat || 0) <= STATE_TTL;
}
