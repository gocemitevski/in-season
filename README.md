# In Season

**Which fruits and vegetables are in season this month in your country.**

In Season is a free web app that shows seasonal produce for **197 countries** and **62 fruits & vegetables**, using climate zones and hemisphere-aware month shifts (including southern-hemisphere seasons).

## Features

- Month picker (12 months) with fruit / vegetable toggle
- Country select for all 197 countries; optional IP-based location
- Shareable URLs: country + month in the query string (e.g. `/?c=FR&m=7`)
- Season windows per climate zone; southern hemisphere months shifted +6 when needed
- Custom monoline produce icons; links out to Wikipedia for each item
- Prerendered HTML + JSON-LD for search and social previews
- Works without JavaScript (noscript fallback)

## Stack

- [React 19](https://react.dev) + [Vite](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- oxlint
- Static JSON data (`src/data/countries.json`, `src/data/produce.json`)

## Development

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Client build → SSR build → prerender into `dist/` |
| `npm run lint` | oxlint |
| `npm run check:data` | Validate countries/produce JSON |
| `npm run icons` | Regenerate favicon/PWA icons from the 🌿 emoji |
| `npm run og` | Regenerate the social share image (`public/og.png`) |
| `npm run preview` | Preview the production build |

### Production build URL

Prerender rewrites canonical / Open Graph / sitemap / `llms.txt` URLs at build time:

```bash
SITE_URL=https://your-domain.example npm run build
```

Defaults to `http://localhost:4173` if `SITE_URL` is unset.

## Deploy (GitHub Pages)

Pushing to `master` runs `.github/workflows/deploy.yml`, which builds `dist/` and publishes it with the official Pages actions.

The site serves from the custom domain **https://in-season.gocemitevski.com**. With Pages publishing via GitHub Actions, the domain is configured only in **Settings → Pages → Custom domain** — no `CNAME` file in the repo (GitHub ignores it in this mode).

One-time setup:

1. Repo → **Settings → Pages → Source**: **GitHub Actions**
2. Repo → **Settings → Pages → Custom domain**: `in-season.gocemitevski.com`, then enable **Enforce HTTPS**
3. DNS: `CNAME` record pointing `in-season` → `<owner>.github.io`
4. Optional: repository variable `SITE_URL` overrides the default `https://in-season.gocemitevski.com`

The build uses Vite `base: './'`, so the same `dist/` works at a domain root or a subpath. `SITE_URL` controls canonical / Open Graph / sitemap / `llms.txt` / `404.html` absolute URLs.

### Google Analytics

Production builds inject the GA4 measurement ID via the `VITE_GA_ID` build env. Set it once:

1. Repo → **Settings → Secrets and variables → Actions → Variables**
2. Add `GA_MEASUREMENT_ID` = `G-XXXXXXXXXX` (repository-level, or scoped to the `github-pages` environment — both work; the build job runs in that environment)

The deploy workflow passes it to the build as `VITE_GA_ID`. gtag's automatic `page_view` is disabled; the app sends a single pageview after hydration for the initial URL and again on each country/month/category change. Dev servers and builds without `VITE_GA_ID` skip analytics entirely.

For a local production build with analytics:

```bash
VITE_GA_ID=G-XXXXXXXXXX SITE_URL=https://in-season.gocemitevski.com npm run build
```

## Data

- **Countries** — ISO codes, climate zones (`temperate`, `continental`, `mediterranean`, `subtropical`, `tropical`, `arid`), hemisphere
- **Produce** — type, color, emoji fallback, season months (and optional `monthsSouth`), climate zones, Wikipedia URL

Seasonality is approximate and varies by region, altitude, and growing method.

## License

Licensed under the [GNU General Public License v3.0](LICENSE) (GPL-3.0).
