import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = join(root, 'public', 'og.png')

const WIDTH = 1200
const HEIGHT = 630

// Colorful, recognizable picks from the produce set (colors from produce.json).
const PICKS = [
  'strawberry',
  'broccoli',
  'carrot',
  'blueberry',
  'tomato',
  'lemon',
  'eggplant',
  'avocado',
  'grape',
  'pumpkin',
  'peach',
  'watermelon',
]

const produce = JSON.parse(readFileSync(join(root, 'src/data/produce.json'), 'utf8'))

// Same self-hosted Quicksand the site uses; setContent has no origin, so inline it.
const quicksand = readFileSync(
  join(root, 'src/assets/fonts/Quicksand-latin.woff2'),
).toString('base64')
const colorOf = new Map(produce.map((item) => [item.id, item.color]))
// Per-icon contrast overrides (produce.json hues wash out on pale tints).
const COLOR_FIX = new Map([
  ['lemon', '#c9900a'],
  ['avocado', '#5f7a28'],
])
const colorFor = (id) => COLOR_FIX.get(id) ?? colorOf.get(id) ?? '#549644'

function iconSvg(id) {
  const path = join(root, 'src/assets/icons', `${id}.svg`)
  if (!existsSync(path)) throw new Error(`Missing icon: ${id}`)
  return readFileSync(path, 'utf8').trim()
}

const tiles = PICKS.map((id, index) => {
  const color = colorFor(id)
  const col = index % 3
  const row = Math.floor(index / 3)
  const rotation = [-7, 5, -4, 6, -5, 8, -6, 4, -8, 5, -3, 7][index] ?? 0
  return `
    <div class="tile" style="left:${col * 162}px; top:${row * 140}px; transform:rotate(${rotation}deg)">
      <div class="tile-inner" style="box-shadow:0 10px 24px -8px ${color}55">
        <span class="tile-bg" style="background:${color}1a"></span>
        <span class="tile-icon" style="fill:${color}">${iconSvg(id)}</span>
      </div>
    </div>`
})

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
    background:
      radial-gradient(560px 420px at 88% 12%, #deedd4 0%, transparent 62%),
      radial-gradient(520px 400px at 12% 96%, #f1f8ec 0%, transparent 60%),
      radial-gradient(380px 300px at 70% 90%, #fdf0d0 0%, transparent 65%),
      #f2f5ef;
    color: #1c2a1e;
    -webkit-font-smoothing: antialiased;
  }
  .frame {
    position: absolute;
    inset: 0;
    padding: 64px 72px;
    display: flex;
    align-items: center;
    gap: 56px;
  }
  .copy { flex: 1 1 auto; min-width: 0; max-width: 640px; }
  .brand {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 30px;
    font-weight: 700;
    color: #3f7734;
    letter-spacing: -0.01em;
  }
  .brand .leaf { font-size: 38px; line-height: 1; }
  h1 {
    margin-top: 40px;
    font-size: 76px;
    line-height: 1.02;
    font-weight: 700;
    letter-spacing: -0.03em;
    color: #1c2a1e;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin-top: 44px;
    padding: 14px 26px;
    border-radius: 999px;
    background: #ffffff;
    border: 2px solid #c3deb3;
    box-shadow: 0 6px 18px -8px rgb(42 78 37 / 0.25);
    font-size: 24px;
    font-weight: 600;
    color: #32602a;
  }
  .chip .dot { width: 10px; height: 10px; border-radius: 50%; background: #74b25e; }
  .collage {
    position: relative;
    width: 472px;
    height: 546px;
    flex: 0 0 auto;
  }
  .tile { position: absolute; width: 148px; height: 126px; }
  .tile-inner {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 28px;
    overflow: hidden;
  }
  .tile-bg { position: absolute; inset: 0; }
  .tile-icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tile-icon svg {
    width: 80px;
    height: 80px;
    display: block;
    /* Override the icons' root fill attribute; inherit the tint from .tile-icon. */
    fill: inherit;
  }
</style>
</head>
<body>
  <div class="frame">
    <div class="copy">
      <div class="brand"><span class="leaf">🌿</span> In Season</div>
      <h1>Fruits &amp; vegetables in&nbsp;season</h1>
      <div class="chip">Anywhere on Earth</div>
    </div>
    <div class="collage">${tiles.join('')}</div>
  </div>
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
