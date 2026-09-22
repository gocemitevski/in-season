import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssrOut = join(root, 'dist-ssr')

const LOCAL_ORIGIN = 'http://localhost:4173'
const siteUrl = (process.env.SITE_URL || LOCAL_ORIGIN).replace(/\/$/, '')
const buildMonth = new Date().getMonth() + 1
const initialState = {
  location: { code: 'US', source: 'default' },
  month: buildMonth,
  category: 'fruit',
}

const serverEntry = join(ssrOut, 'entry-server.js')
if (!existsSync(serverEntry)) {
  console.error('Missing dist-ssr/entry-server.js — run vite build --ssr first')
  process.exit(1)
}

const { render } = await import(serverEntry)
const appHtml = render(initialState)

const indexPath = join(dist, 'index.html')
let html = readFileSync(indexPath, 'utf8')

const rootOpen = '<div id="root"></div>'
if (html.includes(rootOpen)) {
  html = html.replace(rootOpen, `<div id="root">${appHtml}</div>`)
} else {
  console.warn('prerender: #root placeholder not found; skipping HTML injection')
}

const stateScript = `<script>window.__INITIAL_STATE__=${JSON.stringify(initialState)}</script>`
html = html.replace('</head>', `${stateScript}</head>`)

// index.html ships localhost placeholders (canonical, og:url, JSON-LD).
html = html.replaceAll(LOCAL_ORIGIN, siteUrl)

// SSR emits root-absolute asset paths; the client resolves the same assets
// via new URL(..., import.meta.url) → fully absolute. Match them so
// hydration (and subpath hosting) sees identical URLs.
html = html.replaceAll('src="/assets/', `src="${siteUrl}/assets/`)
html = html.replaceAll('href="/assets/', `href="${siteUrl}/assets/`)

const absolutize = (value) => {
  if (!value) return value
  if (/^https?:\/\//.test(value)) return value
  if (value.startsWith('/')) return siteUrl + value
  return `${siteUrl}/${value}`
}

html = html.replace(
  /<link rel="canonical" href="([^"]*)" \/>/g,
  (_, href) => `<link rel="canonical" href="${absolutize(href)}" />`,
)
html = html.replace(
  /<meta property="og:url" content="([^"]*)" \/>/g,
  (_, href) => `<meta property="og:url" content="${absolutize(href)}" />`,
)
html = html.replace(
  /<meta property="og:image" content="([^"]*)" \/>/g,
  (_, href) => `<meta property="og:image" content="${absolutize(href)}" />`,
)
html = html.replace(
  /<meta name="twitter:image" content="([^"]*)" \/>/g,
  (_, href) => `<meta name="twitter:image" content="${absolutize(href)}" />`,
)
html = html.replace(
  /("url":\s*")\/(")/g,
  `$1${absolutize('/')}$2`,
)

writeFileSync(indexPath, html)

const robotsPath = join(dist, 'robots.txt')
if (existsSync(robotsPath)) {
  let robots = readFileSync(robotsPath, 'utf8')
  robots = robots.replace('Sitemap: /sitemap.xml', `Sitemap: ${siteUrl}/sitemap.xml`)
  writeFileSync(robotsPath, robots)
}

const sitemapPath = join(dist, 'sitemap.xml')
if (existsSync(sitemapPath)) {
  let sitemap = readFileSync(sitemapPath, 'utf8')
  sitemap = sitemap.replaceAll('<loc>/</loc>', `<loc>${siteUrl}/</loc>`)
  writeFileSync(sitemapPath, sitemap)
}

const llmsPath = join(dist, 'llms.txt')
if (existsSync(llmsPath)) {
  let llms = readFileSync(llmsPath, 'utf8')
  llms = llms.replaceAll('SITEMAP_URL', `${siteUrl}/sitemap.xml`)
  writeFileSync(llmsPath, llms)
}

// 404.html is served for any unknown path, so root-absolute links must be
// rewritten to the deployed origin (GitHub Pages project sites live under /repo/).
const notFoundPath = join(dist, '404.html')
if (existsSync(notFoundPath)) {
  let notFound = readFileSync(notFoundPath, 'utf8')
  notFound = notFound.replace(/href="(\/[^"]*)"/g, (_, path) => `href="${siteUrl}${path}"`)
  writeFileSync(notFoundPath, notFound)
}

mkdirSync(join(dist, 'assets'), { recursive: true })
console.log(
  `prerender: injected app HTML + state (month ${buildMonth}) into dist/index.html (site: ${siteUrl})`,
)
