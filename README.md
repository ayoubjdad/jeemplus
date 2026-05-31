# Jeemplus (Fanbase)

Football fan app for Botola Pro, daily matches, Moroccan internationals, and World Cup coverage.

## Stack

- React 19 + Vite
- TanStack Query
- MUI + Sass
- **API-Football v3** (via server-side Netlify proxy)
- Netlify (hosting + functions)

## Local development

1. Copy environment file:

```bash
cp .env.example .env
```

2. Add your API-Football key to `.env`:

```env
API_FOOTBALL_KEY=your_key_here
```

3. Install and run:

```bash
pnpm install
pnpm dev
```

The Vite dev server proxies `/football-api/*` to API-Football and injects your key from `API_FOOTBALL_KEY`.

## Production (Netlify)

1. Set **`API_FOOTBALL_KEY`** in Netlify environment variables (Site settings → Environment variables).
2. Do **not** expose the key via `VITE_*` variables.
3. Deploy — `netlify.toml` routes `/football-api/*` to the `football-api` serverless function with caching headers.

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
