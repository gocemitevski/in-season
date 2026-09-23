# AGENTS.md

## Commands

- Verification order (mirrors CI in `.github/workflows/deploy.yml`): `npm run lint` → `npm run check:data` → `npm run build`. Run all three before declaring work done.
- No test runner and no typecheck exist in this repo. Manual check: build, then serve `dist/` statically (e.g. `python3 -m http.server 4173`) — do not rely on `vite preview` for prerendered HTML checks.
- Asset generators: `npm run og` and `npm run icons` render via playwright-core + Chrome. They require Chrome at `/usr/bin/google-chrome` (override with `CHROME_PATH`) and launch with `--no-sandbox`. If you change their HTML templates, regenerate and commit the outputs in `public/`.
- `npm run fetch:icons` is optional tooling for pulling a third-party icon for a *new* produce id; all 62 current icons are hand-authored.

## Build architecture

- `npm run build` is three stages: (1) Vite client build → `dist/`, (2) Vite SSR build of `src/entry-server.jsx` → `dist-ssr/`, (3) `scripts/prerender.mjs` injects SSR HTML + `window.__INITIAL_STATE__` into `dist/index.html` and rewrites absolute URLs (canonical/OG/sitemap/`llms.txt`/`404.html`) from `SITE_URL` (default `http://localhost:4173`). Never hand-edit `dist/` or `dist-ssr/`.
- `src/main.jsx` hydrates only when prerender state is present, otherwise `createRoot` — don't break this branch.
- Vite `base: './'` (relative asset URLs) is required so one build works at domain root or a GH Pages subpath.
- No router: URL state (`?c=FR&m=7&t=vegetable`) is synced manually in `src/App.jsx`. Any new URL param must be kept in sync both directions.

## Data and icons

- Edit `src/data/countries.json` (197) / `src/data/produce.json` (62) only alongside `npm run check:data`; schema described in README → Data.
- Produce icons in `src/assets/icons/*.svg`: monoline, `viewBox="0 0 64 64"`, no width/height, root `fill="#1a1a1a"`. They are tinted via CSS `fill` inheritance (see `ProduceCard.jsx`, `scripts/generate-og.mjs`) — don't hardcode per-icon colors.
- Design tokens for the site (and for the icon/OG generators' HTML templates) live in `src/index.css` (`--color-leaf-*`, `--color-sun-*`, `--color-cream`, `--color-ink`).

## Lint

- oxlint only — no ESLint/Prettier config exists. Expected baseline: **0 warnings**.
- The three post-hydration effects (`App.jsx` URL month/category, `Header.jsx` `selectReady`, `useLocation.js` URL/stored country) legitimately call setState and carry scoped `oxlint-disable react/set-state-in-effect` comments with reasons. Hydration requires "apply external state after first render" — do not remove the disables, and do not "fix" these by reading the URL/storage during render (that mismatches the prerendered HTML).

## Deploy / env

- Push to `master` auto-deploys GitHub Pages. The **build** job runs in the `github-pages` environment on purpose, so Actions variables scoped to that environment are visible.
- GA: repository variable `GA_MEASUREMENT_ID` → passed as `VITE_GA_ID` at build. In `src/lib/ga.js`, gtag's automatic `page_view` is disabled and pageviews are sent manually — don't re-enable auto hits. (The filename avoids "analytics" so generic `analytics.js` ad-block rules don't break `npm run dev`.)
- `SITE_URL` env overrides the hardcoded default domain at prerender time.
- No `CNAME` file — with Pages-via-Actions the domain lives only in Settings → Pages → Custom domain (adding a CNAME file is ignored).

## App behavior gotchas

- Country selection: fresh visits resolve via IP geolocation; a manual choice is persisted; the header home link (`href="./"`) intentionally omits `preventDefault` so it triggers a full reload and re-runs detection. Preserve this.
- The country select is client-gated (`selectReady` in `Header.jsx`) and must not render during SSR.

## Conventions

- Commit messages: plain imperative mood, no conventional-commit prefixes (e.g. `Add regenerable social share image script`).
- Only commit/push when the user explicitly asks.
- When visually verifying regenerated images (`public/og.png`, icons), read a uniquely-named temp copy — the file reader may serve a stale cache of the original path.
