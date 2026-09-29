# SkyblockCal

Hypixel SkyBlock events as a calendar subscription (`.ics` feed). Users pick which events they want, get one private URL, and add it to Apple / Google / Outlook calendar.

```
packages/core   SkyBlock time maths, event rules, ICS writer (shared by web + api)
apps/api        Hono + Postgres: auth, prefs, /cal/:token.ics feed; serves the built web app in production
apps/web        Vite + React + Tailwind
```

## Dev

```sh
pnpm install
cp .env.example .env            # set DATABASE_URL to a local Postgres
pnpm dev                        # web on :5173 (proxies /api and /cal), api on :3000
pnpm test                       # core tests
```

Quick local Postgres: `docker run -d -p 5432:5432 -e POSTGRES_USER=sbcal -e POSTGRES_PASSWORD=change-me -e POSTGRES_DB=sbcal postgres:17-alpine`

## Deploy (Dokploy)

1. New **Compose** service pointing at this repo (`docker-compose.yml`).
2. Environment: `POSTGRES_PASSWORD`, `APP_ORIGIN=https://your.domain`.
3. Domains: attach your domain to service **app**, port **3000**, HTTPS on. Traefik handles TLS/routing; no nginx needed.

Tables are created on startup.

## Adding or fixing an event

Everything lives in `packages/core/src/events.ts`: add the id to `CategoryId`, an entry to `CATEGORIES`, and a case in `occurrencesInYear`. Then give it a sprite in `apps/web/src/components/PixelIcon.tsx`.

Event timings follow https://hypixelskyblock.minecraft.wiki/.
