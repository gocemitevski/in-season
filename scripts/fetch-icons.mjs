#!/usr/bin/env node
/**
 * Icon management for produce SVGs.
 *
 * All 62 icons are hand-authored CUSTOM flat-style SVGs in src/assets/icons/
 * (viewBox="0 0 64 64", no width/height attrs). No third-party icon library.
 *
 * Kept for reference / optional fallback: ICON_MAP lists every produce id.
 * Every entry is CUSTOM. If you ever need to re-fetch a third-party source
 * for a new item, put `prefix:name` here and run: npm run fetch:icons
 *
 * Uses the Iconify JSON batch API (one request per icon prefix).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'src', 'assets', 'icons')

/**
 * produce id -> 'CUSTOM' (hand-authored) or 'prefix:name' (Iconify ref).
 * All current entries are CUSTOM.
 */
const ICON_MAP = {
  strawberry: 'CUSTOM',
  cherry: 'CUSTOM',
  apricot: 'CUSTOM',
  peach: 'CUSTOM',
  plum: 'CUSTOM',
  grape: 'CUSTOM',
  watermelon: 'CUSTOM',
  melon: 'CUSTOM',
  blueberry: 'CUSTOM',
  raspberry: 'CUSTOM',
  blackberry: 'CUSTOM',
  apple: 'CUSTOM',
  pear: 'CUSTOM',
  orange: 'CUSTOM',
  mandarin: 'CUSTOM',
  lemon: 'CUSTOM',
  grapefruit: 'CUSTOM',
  banana: 'CUSTOM',
  mango: 'CUSTOM',
  pineapple: 'CUSTOM',
  papaya: 'CUSTOM',
  coconut: 'CUSTOM',
  kiwi: 'CUSTOM',
  pomegranate: 'CUSTOM',
  fig: 'CUSTOM',
  avocado: 'CUSTOM',
  dates: 'CUSTOM',
  lychee: 'CUSTOM',
  'passion-fruit': 'CUSTOM',
  cranberry: 'CUSTOM',
  tomato: 'CUSTOM',
  cucumber: 'CUSTOM',
  zucchini: 'CUSTOM',
  carrot: 'CUSTOM',
  potato: 'CUSTOM',
  'sweet-potato': 'CUSTOM',
  corn: 'CUSTOM',
  'bell-pepper': 'CUSTOM',
  'chili-pepper': 'CUSTOM',
  broccoli: 'CUSTOM',
  cauliflower: 'CUSTOM',
  cabbage: 'CUSTOM',
  lettuce: 'CUSTOM',
  spinach: 'CUSTOM',
  kale: 'CUSTOM',
  onion: 'CUSTOM',
  garlic: 'CUSTOM',
  radish: 'CUSTOM',
  beetroot: 'CUSTOM',
  asparagus: 'CUSTOM',
  celery: 'CUSTOM',
  eggplant: 'CUSTOM',
  pumpkin: 'CUSTOM',
  'green-beans': 'CUSTOM',
  peas: 'CUSTOM',
  mushroom: 'CUSTOM',
  artichoke: 'CUSTOM',
  fennel: 'CUSTOM',
  leek: 'CUSTOM',
  turnip: 'CUSTOM',
  'brussels-sprouts': 'CUSTOM',
  okra: 'CUSTOM',
}

const ATTEMPTS = 5

async function fetchJson(url) {
  let res
  for (let i = 0; i < ATTEMPTS; i++) {
    res = await fetch(url, { headers: { 'User-Agent': 'in-season-build' } })
    if (res.status === 429) {
      const wait = 2000 * (i + 1)
      console.log(`  429 rate-limited, waiting ${wait}ms…`)
      await new Promise((r) => setTimeout(r, wait))
      continue
    }
    break
  }
  if (!res?.ok) throw new Error(`${res?.status} ${url}`)
  return res.json()
}

function toSvgFile(icon) {
  const width = icon.width ?? 64
  const height = icon.height ?? 64
  const viewBox = icon.left != null
    ? `${icon.left} ${icon.top} ${width} ${height}`
    : `0 0 ${width} ${height}`
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${icon.body}</svg>\n`
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })

  const byPrefix = new Map()
  for (const [id, ref] of Object.entries(ICON_MAP)) {
    if (ref === 'CUSTOM') continue
    const [prefix, name] = ref.split(':')
    if (!byPrefix.has(prefix)) byPrefix.set(prefix, new Map())
    const byName = byPrefix.get(prefix)
    if (!byName.has(name)) byName.set(name, [])
    byName.get(name).push(id)
  }

  for (const [prefix, icons] of byPrefix) {
    const names = [...icons.keys()]
    console.log(`fetching ${names.length} icons from ${prefix}…`)
    const url = `https://api.iconify.design/${prefix}.json?icons=${names.join(',')}`
    const data = await fetchJson(url)
    if (data.error) throw new Error(`${prefix}: ${data.error}`)
    for (const [name, ids] of icons) {
      const icon = data.icons?.[name]
      if (!icon) {
        console.warn(`  missing in ${prefix}: ${name} (for ${ids.join(', ')})`)
        continue
      }
      const svg = toSvgFile(icon)
      for (const id of ids) {
        fs.writeFileSync(path.join(outDir, `${id}.svg`), svg)
      }
    }
  }

  const files = fs.readdirSync(outDir).filter((f) => f.endsWith('.svg'))
  console.log(`done: ${files.length} svg files in src/assets/icons/`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
