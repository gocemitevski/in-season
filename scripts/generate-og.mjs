import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = join(root, 'public', 'og.png')

const WIDTH = 1200
const HEIGHT = 630

// Mini ProduceCards thrown around the centered copy — fixed coords so every
// regeneration produces the identical image. Later entries paint on top;
// placements never intersect each other or the copy block (see verify step).
// 12 cards, mirror-symmetric around the 600px center: paired x positions and
// rotations, uniform y per edge. Later entries paint on top; placements never
// intersect each other or the copy block (see verify step).
const PICKS = [
  { id: 'strawberry', x: -40, y: -70, rot: -6 },
  { id: 'broccoli', x: 300, y: -65, rot: 5 },
  { id: 'carrot', x: 750, y: -65, rot: -5 },
  { id: 'tomato', x: 1090, y: -70, rot: 6 },
  { id: 'lemon', x: 1015, y: 145, rot: -7 },
  { id: 'eggplant', x: 1000, y: 330, rot: 4 },
  { id: 'avocado', x: 1025, y: 560, rot: -6 },
  { id: 'grape', x: 675, y: 555, rot: 7 },
  { id: 'pumpkin', x: 375, y: 555, rot: -7 },
  { id: 'watermelon', x: 25, y: 560, rot: 6 },
  { id: 'peach', x: 50, y: 330, rot: -4 },
  { id: 'blueberry', x: 35, y: 145, rot: 7 },
]

const produce = JSON.parse(readFileSync(join(root, 'src/data/produce.json'), 'utf8'))

// Same self-hosted Quicksand the site uses; setContent has no origin, so inline it.
const quicksand = readFileSync(
  join(root, 'src/assets/fonts/Quicksand-latin.woff2'),
).toString('base64')
const colorOf = new Map(produce.map((item) => [item.id, item.color]))

function iconSvg(id) {
  const path = join(root, 'src/assets/icons', `${id}.svg`)
  if (!existsSync(path)) throw new Error(`Missing icon: ${id}`)
  return readFileSync(path, 'utf8').trim()
}

// App-accurate mini card: white, leaf-200 hairline, shadow-sm, pale tint
// tile, ink monoline icon (ProduceCard.jsx proportions, scaled down).
const cards = PICKS.map(({ id, x, y, rot }) => {
  const color = colorOf.get(id) ?? '#549644'
  return `
    <div class="card" style="left:${x}px; top:${y}px; transform:rotate(${rot}deg)">
      <div class="tile" style="background:${color}1a">${iconSvg(id)}</div>
    </div>`
}).join('')

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'Quicksand';
    font-style: normal;
    font-weight: 400 700;
    src: url(data:font/woff2;base64,${quicksand}) format('woff2');
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    position: relative;
    font-family: 'Quicksand', ui-sans-serif, system-ui, sans-serif;
    background: #f2f5ef;
    color: #1c2a1e;
    -webkit-font-smoothing: antialiased;
  }

  .copy {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    text-align: center;
  }
  .brand {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: fit-content;
    margin-inline: auto;
    font-size: 28px;
    font-weight: 700;
    color: #3f7734;
    letter-spacing: -0.01em;
  }
  .brand .leaf { font-size: 32px; line-height: 1; }
  h1 {
    width: fit-content;
    margin-inline: auto;
    margin-top: 24px;
    font-size: 92px;
    line-height: 1.02;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #1c2a1e;
  }
  .sub {
    width: fit-content;
    margin-inline: auto;
    margin-top: 20px;
    font-size: 27px;
    font-weight: 500;
    line-height: 1.35;
    color: rgb(28 42 30 / 0.72);
  }
  .search-pill {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-top: 30px;
    height: 52px;
    padding: 0 22px;
    border-radius: 999px;
    background: #ffffff;
    border: 2px solid #c3deb3;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    font-size: 21px;
    font-weight: 600;
    color: #32602a;
  }
  .search-pill svg { display: block; }
  .url {
    width: fit-content;
    margin-inline: auto;
    margin-top: 22px;
    font-size: 16px;
    font-weight: 500;
    color: rgb(28 42 30 / 0.45);
  }

  .card {
    position: absolute;
    width: 150px;
    height: 150px;
    background: #ffffff;
    border: 1px solid #c3deb3;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  }
  .tile {
    width: 118px;
    height: 118px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tile svg {
    width: 84px;
    height: 84px;
    display: block;
    /* Icons ship a root fill attribute; the CSS declaration wins — ink, like the site. */
    fill: #1a1a1a;
  }
</style>
</head>
<body>
  <div class="copy">
    <div class="brand"><span class="leaf">🌿</span> In Season</div>
    <h1>What&rsquo;s in season?</h1>
    <div class="sub">Fruits &amp; vegetables by month and country.</div>
    <div class="search-pill">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20.5 20.5-4-4" />
      </svg>
      Anywhere on Earth
    </div>
    <div class="url">in-season.gocemitevski.com</div>
  </div>
  ${cards}
</body>
</html>`

const chromePath =
  process.env.CHROME_PATH ||
  '/usr/bin/google-chrome'

const browser = await chromium.launch({
  executablePath: chromePath,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
try {
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  })
  await page.setContent(html, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)

  // Geometric guard: cards must not intersect each other or the copy elements.
  const layout = await page.evaluate(() => {
    const rectOf = (el) => {
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height }
    }
    return {
      cards: [...document.querySelectorAll('.card')].map(rectOf),
      copy: ['.brand', 'h1', '.sub', '.search-pill', '.url'].map((s) =>
        rectOf(document.querySelector(s)),
      ),
    }
  })

  // Conservative: AABBs of rotated cards are larger than the cards themselves,
  // so any pass here guarantees the painted rects cannot intersect.
  const intersects = (a, b) =>
    !(
      a.x + a.w <= b.x || b.x + b.w <= a.x ||
      a.y + a.h <= b.y || b.y + b.h <= a.y
    )

  const violations = []
  const { cards, copy } = layout
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (intersects(cards[i], cards[j])) violations.push(`card ${i} x card ${j}`)
    }
    for (let k = 0; k < copy.length; k++) {
      if (intersects(cards[i], copy[k])) violations.push(`card ${i} x copy[${k}]`)
    }
  }
  if (violations.length) {
    throw new Error(`Layout overlaps: ${violations.join('; ')}`)
  }

  const buffer = await page.screenshot({ type: 'png' })

  // PNG IHDR: width at bytes 16..20, height at 20..24.
  const width = buffer.readUInt32BE(16)
  const height = buffer.readUInt32BE(20)
  if (width !== WIDTH || height !== HEIGHT) {
    throw new Error(`Unexpected screenshot size ${width}x${height}`)
  }
  writeFileSync(outPath, buffer)
  console.log(`og: wrote ${outPath} (${width}x${height}, ${buffer.length} bytes)`)
} finally {
  await browser.close()
}
