import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { CATEGORIES, buildIcs, generateEvents, type CategoryId, type Prefs } from "@sbcal/core";
import { Hono } from "hono";
import { z } from "zod";
import {
  createSession,
  destroySession,
  hashPassword,
  randomToken,
  rateLimit,
  requireUser,
  verifyPassword,
  type AuthEnv,
} from "./auth.ts";
import { migrate, sql, type FeedRow, type UserRow } from "./db.ts";
import { getMayor } from "./mayor.ts";

const PORT = Number(process.env.PORT ?? 3000);
const ALLOWED_ORIGINS = (process.env.APP_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

/** How far ahead the feed reaches. Calendar apps poll every few hours, so a few weeks is plenty. */
const FEED_AHEAD_MS = 21 * 86_400_000;
const FEED_BEHIND_MS = 86_400_000;

const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

const categoryIds = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];
const prefsSchema = z.partialRecord(
  z.enum(categoryIds),
  z.object({
    enabled: z.boolean(),
    alarm: z.number().int().min(0).max(1440).nullable(),
  }),
);

const app = new Hono();

// Cookies are SameSite=Lax; on top of that refuse cross-site writes outright.
app.use("/api/*", async (c, next) => {
  if (c.req.method !== "GET" && c.req.method !== "HEAD") {
    const origin = c.req.header("origin");
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return c.json({ error: "bad origin" }, 403);
  }
  await next();
});

app.get("/api/health", (c) => c.json({ ok: true }));

const authLimit = rateLimit(20, 15 * 60_000);

app.post("/api/auth/register", authLimit, async (c) => {
  const parsed = credentials.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
  const { email, password } = parsed.data;

  const passwordHash = await hashPassword(password);
  const [user] = await sql<UserRow[]>`
    insert into users (email, password_hash) values (${email}, ${passwordHash})
    on conflict (email) do nothing
    returning id, email`;
  if (!user) return c.json({ error: "An account with that email already exists" }, 409);

  await createSession(c, user.id);
  return c.json({ ok: true });
});

app.post("/api/auth/login", authLimit, async (c) => {
  const parsed = credentials.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Wrong email or password" }, 400);
  const { email, password } = parsed.data;

  const [user] = await sql<UserRow[]>`select id, password_hash from users where email = ${email}`;
  if (!user || !(await verifyPassword(user.password_hash, password))) {
    return c.json({ error: "Wrong email or password" }, 401);
  }
  await createSession(c, user.id);
  return c.json({ ok: true });
});

app.post("/api/auth/logout", async (c) => {
  await destroySession(c);
  return c.json({ ok: true });
});

app.get("/api/mayor", async (c) => {
  const mayor = await getMayor();
  c.header("Cache-Control", "public, max-age=60");
  return c.json(mayor);
});

// Everything registered on this sub-app requires a session; keep public routes above it.
const authed = new Hono<AuthEnv>().use(requireUser);

authed.get("/me", async (c) => {
  const userId = c.get("userId");
  const [user] = await sql<UserRow[]>`select id, email from users where id = ${userId}`;
  const [feed] = await sql<FeedRow[]>`
    select token, prefs, updated_at, last_fetched_at from feeds where user_id = ${userId}`;
  return c.json({
    email: user?.email,
    feed: feed
      ? { token: feed.token, prefs: feed.prefs, updatedAt: feed.updated_at, lastFetchedAt: feed.last_fetched_at }
      : null,
  });
});

authed.put("/feed", async (c) => {
  const parsed = prefsSchema.safeParse((await c.req.json().catch(() => null))?.prefs);
  if (!parsed.success) return c.json({ error: "Invalid preferences" }, 400);
  const [feed] = await sql<FeedRow[]>`
    insert into feeds (user_id, token, prefs)
    values (${c.get("userId")}, ${randomToken(24)}, ${sql.json(parsed.data)})
    on conflict (user_id) do update set prefs = excluded.prefs, updated_at = now()
    returning token`;
  return c.json({ token: feed!.token });
});

/** Invalidates the old subscription URL, e.g. if it leaked. */
authed.post("/feed/rotate", async (c) => {
  const [feed] = await sql<FeedRow[]>`
    update feeds set token = ${randomToken(24)}, last_fetched_at = null
    where user_id = ${c.get("userId")} returning token`;
  if (!feed) return c.json({ error: "No feed yet" }, 404);
  return c.json({ token: feed.token });
});

authed.delete("/me", async (c) => {
  await sql`delete from users where id = ${c.get("userId")}`;
  await destroySession(c);
  return c.json({ ok: true });
});

app.route("/api", authed);

app.get("/cal/:file", async (c) => {
  const token = c.req.param("file").replace(/\.ics$/, "");
  const [feed] = await sql<FeedRow[]>`
    update feeds set last_fetched_at = now() where token = ${token} returning prefs`;
  if (!feed) return c.text("Not found", 404);

  const prefs = feed.prefs as Prefs;
  const enabled = CATEGORIES.filter((cat) => prefs[cat.id]?.enabled).map((cat) => cat.id);
  const now = Date.now();
  const events = generateEvents({
    from: now - FEED_BEHIND_MS,
    to: now + FEED_AHEAD_MS,
    categories: enabled,
    mayor: enabled.some((id) => CATEGORIES.find((cat) => cat.id === id)?.perk) ? await getMayor() : null,
  });

  c.header("Content-Type", "text/calendar; charset=utf-8");
  c.header("Content-Disposition", 'inline; filename="skyblock.ics"');
  c.header("Cache-Control", "private, max-age=300");
  return c.body(buildIcs({ name: "SkyBlock Events", events, prefs, now }));
});

// In production the built web app is served from here; in dev Vite serves it and proxies to us.
const STATIC_DIR = process.env.STATIC_DIR;
if (STATIC_DIR) {
  app.use("/assets/*", async (c, next) => {
    await next();
    c.header("Cache-Control", "public, max-age=31536000, immutable");
  });
  app.use("*", serveStatic({ root: STATIC_DIR }));
  // SPA fallback for client-side routes.
  app.get("*", serveStatic({ root: STATIC_DIR, path: "index.html" }));
}

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal error" }, 500);
});

await migrate();
serve({ fetch: app.fetch, port: PORT }, (info) => console.log(`api listening on :${info.port}`));

const shutdown = () => sql.end({ timeout: 5 }).finally(() => process.exit(0));
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
