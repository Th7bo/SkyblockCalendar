import { createHash, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { sql } from "./db.ts";

const COOKIE = "sbcal_session";
const SESSION_DAYS = 30;
const DAY = 86_400_000;
const secure = process.env.NODE_ENV === "production";

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export const hashPassword = (password: string) => hash(password);
export const verifyPassword = (digest: string, password: string) => verify(digest, password).catch(() => false);

export async function createSession(c: Context, userId: string) {
  const token = randomToken();
  const expires = new Date(Date.now() + SESSION_DAYS * DAY);
  await sql`insert into sessions (id, user_id, expires_at) values (${sha256(token)}, ${userId}, ${expires})`;
  setCookie(c, COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "Lax",
    path: "/",
    expires,
  });
}

export async function destroySession(c: Context) {
  const token = getCookie(c, COOKIE);
  if (token) await sql`delete from sessions where id = ${sha256(token)}`;
  deleteCookie(c, COOKIE, { path: "/" });
}

export type AuthEnv = { Variables: { userId: string } };

/** Resolves the session cookie to a user, extending sessions past their halfway point. */
export const requireUser: MiddlewareHandler<AuthEnv> = async (c, next) => {
  const token = getCookie(c, COOKIE);
  if (!token) return c.json({ error: "unauthorized" }, 401);
  const id = sha256(token);
  const [session] = await sql<{ user_id: string; expires_at: Date }[]>`
    select user_id, expires_at from sessions where id = ${id}`;
  if (!session || session.expires_at.getTime() < Date.now()) {
    deleteCookie(c, COOKIE, { path: "/" });
    return c.json({ error: "unauthorized" }, 401);
  }
  if (session.expires_at.getTime() - Date.now() < (SESSION_DAYS / 2) * DAY) {
    const expires = new Date(Date.now() + SESSION_DAYS * DAY);
    await sql`update sessions set expires_at = ${expires} where id = ${id}`;
    setCookie(c, COOKIE, token, { httpOnly: true, secure, sameSite: "Lax", path: "/", expires });
  }
  c.set("userId", session.user_id);
  await next();
};

/** Tiny fixed-window limiter; good enough for a single API instance. */
export function rateLimit(limit: number, windowMs: number): MiddlewareHandler {
  const hits = new Map<string, { count: number; reset: number }>();
  return async (c, next) => {
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const now = Date.now();
    const entry = hits.get(ip);
    if (!entry || entry.reset < now) {
      hits.set(ip, { count: 1, reset: now + windowMs });
      if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    } else if (++entry.count > limit) {
      c.header("Retry-After", String(Math.ceil((entry.reset - now) / 1000)));
      return c.json({ error: "Too many attempts, try again later." }, 429);
    }
    await next();
  };
}
