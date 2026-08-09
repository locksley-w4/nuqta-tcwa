# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Nuqta" / AI Business Analyzer — produces a bank-grade viability report for opening a business at a given location (Tashkent, Uzbekistan). npm workspaces monorepo: `frontend` (React + Vite) and `backend` (Express).

Note: the git repository root is `nuqta-tcwa/`, one level below `D:\nuqtaa`.

## Commands

```bash
npm install          # from repo root — installs both workspaces
npm run dev          # concurrently runs backend (:5001) + frontend (:5173)
npm run build        # vite build of the frontend workspace only

npm run dev:backend  # nodemon backend/server.js
npm run dev:frontend # vite dev server
```

There is **no test suite, no linter, and no formatter** configured. Don't invent `npm test` / `npm run lint` — they don't exist. To sanity-check backend changes, hit the endpoints directly (e.g. `curl -X POST localhost:5001/analyze -H 'Content-Type: application/json' -d '{"businessType":"Coffee shop","lat":41.2995,"lng":69.2401}'`) and diff the JSON, or `node -e` against the service modules.

Backend is CommonJS (`require`); frontend is ESM (`import`). Don't mix them up.

## Deployment (Vercel)

One Vercel project serves both halves. `vercel.json` sets the build to `npm run build` with output `frontend/dist`, and rewrites `/api/(.*)` to a single serverless function at `api/index.js`, which wraps `backend/app.js`.

The backend suits serverless because it is pure computation — no database, no external calls, no state between requests. Nothing needs a long-lived process.

Two constraints this imposes:
- **Never add `app.listen()` to `app.js`.** It belongs in `server.js`, which Vercel does not execute.
- **Nothing may persist in module scope between requests.** Function instances are recycled without warning and requests do not share one. Analysis history deliberately lives in the browser's `localStorage` for this reason.

`api/index.js` sets `req._body` when Vercel has already parsed the body, otherwise `express.json()` would read the ended stream and overwrite `req.body` with `{}`, turning every POST into a 400.

## Architecture

### Three endpoints, three independent engines

`backend/app.js` builds the Express app and mounts three routers; `backend/server.js` only adds the local listener. Each route file validates input and delegates to a service:

| Route | Service | Purpose |
|---|---|---|
| `POST /analyze` | `services/analyzer.js` | Full site report, Blocks A–G |
| `POST /find-hotspots` | `services/hotspotFinder.js` | Reverse search: grid-scan a bbox for the best spots |
| `POST /analyze-finance` | `services/financialAnalyzer.js` | Loan fundability (DSCR, collateral coverage, verdict) |

Every router is mounted twice — bare (`/analyze`) and prefixed (`/api/analyze`) — so the same app works behind the dev proxy and behind Vercel's routing without depending on URL-rewrite semantics. Add new routers to the `ROUTES` array in `app.js` and both mounts happen automatically.

`/analyze-finance` is completely independent of location — it takes only loan/revenue/collateral/term. The dashboard combines the two scores into the "Overall Business Success Probability" hero only when both results exist.

### All data is mocked but deterministic — this is the central design constraint

There is no database and no external API. Every number comes from `utils/random.js`: an FNV-1a `hashString` of the input tuple seeds an LCG `seededRandom`, and a single `rand` closure is threaded through every block builder in order.

**Consequence: the sequence of `rand()` calls is part of the output contract.** Adding, removing, or reordering a `rand()` call anywhere in `blocks.js` / `lending.js` / `social.js` shifts every downstream value, so an unrelated block's numbers will change. When editing a block builder, append new `rand()` draws at the end of that builder rather than inserting them mid-sequence, unless a shift is acceptable.

Seed inputs:
- `analyzer.js` — `businessType|lat.toFixed(3)|lng.toFixed(3)` (so ~100 m of movement gives identical output)
- `hotspotFinder.js` — `hotspots|profileKey|businessType|scope|bboxMinLat|bboxMinLng`

Since the two engines use different seeds and different scoring math, a hotspot's `suitabilityScore` will **not** equal the `finalScore` you get from drilling into it via `/analyze`. That's expected, not a bug.

### The A–G block model

`services/analyzer.js` is the orchestrator and the file to read first. Blocks map to a "SQB Layer-2 model catalogue"; individual models are labeled in comments as `M-A1`, `M-B3`, etc.

- **A market, B demand, C location, D financials, E risk** → `services/blocks.js`
- **F lending** → `services/lending.js`, **G social/audience** → `services/social.js`

Ordering dependencies inside `analyzeBusiness()`:
1. Block D takes Block B as an argument (cash-flow/NPV needs the revenue forecast).
2. Block E takes `lat`/`lng` (competitor pin placement).
3. Blocks F and G run **after** `summary` is computed, because they consume the rolled-up blocks and scores.

### Scoring

`utils/scoring.js` owns the single formula and the thresholds — change them there, nowhere else:

```
Final = 0.30·Location + 0.25·Demand + 0.20·Competition + 0.25·Financials
YES ≥ 75 (Low risk) · CONDITIONAL 55–74 (Medium) · NO < 55 (High)
```

Business types matching `COMPETITION_SENSITIVE` (cafe, restaurant, bakery, …) get their competition score multiplied by 0.85 in `analyzer.js` before the weighted roll-up.

Business-type routing is done by **regex on lowercased free text** in three separate places with slightly different category sets: `blocks.js: profileKey()`, `hotspotFinder.js: profileFor()`, `scoring.js: isCompetitionSensitive()`. Adding a new business category usually means touching all three plus the `BUSINESS_TYPES` list in `frontend/src/components/Sidebar.jsx`.

`financialAnalyzer.js` is the one service with real (non-mocked) math: standard amortization at a hardcoded 24% APR, DSCR vs. 1.20, collateral coverage vs. 1.25, piecewise-linear sub-scores, then APPROVE/REVIEW/DECLINE.

### Frontend

`pages/Dashboard.jsx` (~550 lines) is the only stateful component — it owns every request lifecycle and all app state. Everything under `components/` is presentational and props-driven.

Two orthogonal state axes, easy to confuse:
- `view` = `'analyze' | 'history'` (which nav item is selected)
- `mode` = `'analyze' | 'find'` (site report vs. hotspot grid)

Key flows:
- **Run analysis** fires `/analyze` and, if the finance form is filled (`financeIsFilled`), `/analyze-finance` in parallel via `Promise.all`. Finance is best-effort; a site result alone is valid.
- **Find location** fires `/find-hotspots` with `scope: 'city' | 'local'` and flips `mode` to `'find'`. Clicking a hotspot pin flips back to `'analyze'` and re-runs the full analysis at that coordinate via a `coordOverride` argument (state updates are async, so the coordinate is passed explicitly rather than read back from `location`).

History is `localStorage` only, key `sqb_analysis_history_v1`, capped at 20 entries, deduped by `businessType` + coords within 1e-4. Entries store the whole result payload so restoring is instant and offline.

API URLs come from `import.meta.env.VITE_API_URL` / `VITE_FINANCE_URL` / `VITE_HOTSPOTS_URL`, defaulting to relative `/api/*` paths. In dev, `vite.config.js` proxies all of `/api` to `:5001`; in production Vercel routes it to the serverless function. The proxy is a single prefix rule, so adding a backend route needs no proxy change.

Geocoding uses Nominatim directly from the browser (no key). Maps are Leaflet + CartoDB tiles.

### Frontend conventions

- Tailwind only, no CSS modules. Custom palette in `tailwind.config.js`: `ink-*` (dark sidebar), `canvas-*` (light main area), `brand-*` (blue). Cards are consistently `rounded-2xl border border-canvas-200 bg-white shadow-card`.
- Icons are `lucide-react`; charts are `recharts`.
- Modals wrap the shared `components/Modal.jsx` (backdrop, scroll lock, Escape). `MapPickerModal` is the exception — it builds its own overlay for the Leaflet map.
- Raw CSS lives only in `src/index.css`, and only for things Tailwind can't reach: Leaflet control overrides and the `hotspot-pulse` keyframe marker.
