# Jeemplus (Fanbase)

Football fan app for Botola Pro, daily matches, Moroccan internationals, and World Cup coverage.

## Stack

- React 19 + Vite
- TanStack Query
- MUI + Sass
- **API-Football v3** (via server-side Netlify proxy)
- Netlify (hosting + functions)

## Environment variables (Netlify)

Configure these in **Site settings → Environment variables** (same value for all deploy contexts):

| Variable | Purpose |
|----------|---------|
| `API_FOOTBALL_KEY` | API-Football v3 key (server-side only — Netlify function + dev proxy) |
| `VITE_FOOTBALL_API_BASE` | Browser base path for football API (e.g. `/football-api`) |
| `VITE_SERVER_URL` | Backend URL for news/images (must allow your Netlify origin in CORS) |

Do **not** prefix the API key with `VITE_` — it must stay server-side.

## Local development

1. Install dependencies:

```bash
pnpm install
```

2. Run with Netlify CLI so env vars from the dashboard are injected (recommended):

```bash
npx netlify dev
```

Alternatively, export the same variables in your shell before `pnpm dev`.

The dev server proxies `/football-api/*` to API-Football and injects `API_FOOTBALL_KEY` from the environment.

## Production (Netlify)

Deploy — `netlify.toml` routes `/football-api/*` to the `football-api` serverless function with caching headers. Build-time `VITE_*` variables are read from Netlify environment variables automatically.

## Architecture

```
Browser → /football-api/* → Netlify function → v3.football.api-sports.io
                ↓
         src/api/football/services (pages import these)
                ↓
         src/api/football/mappers (normalized domain models)
```

Pages never call API-Football directly or use raw API response shapes.

## API quota tips

- React Query uses 60s default `staleTime` to reduce repeat calls.
- Netlify function sets Cache-Control by endpoint type (standings 5–15 min, fixtures 1–2 min).
- Recommended plan for production: **Ultra** ($29/mo, 75k req/day).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run Vitest unit tests |

## Manual QA checklist

- [ ] Matchs du jour loads for today + date picker
- [ ] Internationaux shows Moroccan players
- [ ] Game detail: scores, stats, lineups, events
- [ ] Botola: standings, top players, compare, team detail
- [ ] Interactive screen: defaults to first Botola team
- [ ] World Cup: groups + bracket tab
- [ ] Network tab shows only `/football-api/*` (no API key in browser)
