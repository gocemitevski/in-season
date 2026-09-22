import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')

const EMOJI = '\u{1F33F}' // 🌿
const CREAM = '#f2f5ef'

// scale = emoji font-size relative to canvas; Noto's ink measures ~1.10x font-size,
// so these are pre-divided to hit the target ink fill. Maskable keeps leaf tips
// inside Android's 66/108 safe-zone circle (max ink radius <= ~30.5%).
const targets = [
  { file: 'favicon.png', size: 64, bg: null, scale: 0.78 },
  { file: 'apple-touch-icon.png', size: 180, bg: CREAM, scale: 0.71 },
  { file: 'icon-192.png', size: 192, bg: CREAM, scale: 0.65 },
  { file: 'icon-512.png', size: 512, bg: CREAM, scale: 0.65 },
  { file: 'icon-512-maskable.png', size: 512, bg: CREAM, scale: 0.38 },
]

function pageHtml({ size, bg, scale }) {
  return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${size}px; height: ${size}px; overflow: hidden; }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${bg ?? 'transparent'};
    font-family: 'Noto Color Emoji';
    font-size: ${Math.round(size * scale)}px;
    line-height: 1;
    -webkit-font-smoothing: antialiased;
  }
</style></head><body>${EMOJI}</body></html>`
}

const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome'

const browser = await chromium.launch({
  executablePath: chromePath,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
})
try {
  for (const target of targets) {
    const page = await browser.newPage({
      viewport: { width: target.size, height: target.size },
      deviceScaleFactor: 1,
    })
    await page.setContent(pageHtml(target), { waitUntil: 'load' })
    await page.evaluate(() => document.fonts.ready)
    const buffer = await page.screenshot({
      type: 'png',
      omitBackground: target.bg === null,
    })
    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)
    if (width !== target.size || height !== target.size) {
      throw new Error(`${target.file}: unexpected size ${width}x${height}`)
    }
    const out = join(publicDir, target.file)
    writeFileSync(out, buffer)
    console.log(`icons: wrote ${out} (${width}x${height}, ${buffer.length} bytes)`)
    await page.close()
  }
} finally {
  await browser.close()
}
