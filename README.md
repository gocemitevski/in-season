# In Season

**Which fruits and vegetables are in season this month in your country.**

In Season is a free web app with no analytics that shows seasonal produce for **197 countries** and **62 fruits & vegetables**, using climate zones and hemisphere-aware month shifts (including southern-hemisphere seasons).

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
| `npm run preview` | Preview the production build |

### Production build URL

Prerender rewrites canonical / Open Graph / sitemap / `llms.txt` URLs at build time:

```bash
SITE_URL=https://your-domain.example npm run build
```

Defaults to `http://localhost:4173` if `SITE_URL` is unset.

## Deploy (GitHub Pages)

Pushing to `master` runs `.github/workflows/deploy.yml`, which builds `dist/` and publishes it with the official Pages actions.

One-time setup:

1. Repo → **Settings → Pages → Source**: **GitHub Actions**
2. Optional: add a repository variable `SITE_URL` (e.g. `https://you.github.io/my-repo`) to override the derived URL — needed only for custom domains or `owner.github.io` user sites if you prefer an explicit value

The build uses Vite `base: './'`, so the same `dist/` works at a domain root or a `/repo/` project subpath. `SITE_URL` still controls canonical / Open Graph / sitemap / `llms.txt` / `404.html` absolute URLs.

## Data

- **Countries** — ISO codes, climate zones (`temperate`, `continental`, `mediterranean`, `subtropical`, `tropical`, `arid`), hemisphere
- **Produce** — type, color, emoji fallback, season months (and optional `monthsSouth`), climate zones, Wikipedia URL

Seasonality is approximate and varies by region, altitude, and growing method.

## License

Add a license before publishing.
