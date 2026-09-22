#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import countries from '../src/data/countries.json' with { type: 'json' }
import produce from '../src/data/produce.json' with { type: 'json' }
import { getProduce } from '../src/lib/season.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const iconsDir = path.join(root, 'src', 'assets', 'icons')

const VALID_ZONES = new Set([
  'temperate',
  'continental',
  'mediterranean',
  'subtropical',
  'tropical',
  'arid',
])
const VALID_HEM = new Set(['n', 's', 'e'])
const VALID_TYPES = new Set(['fruit', 'vegetable'])

const errors = []
const fail = (msg) => errors.push(msg)

const codes = new Set()
for (const c of countries) {
  if (!/^[A-Z]{2}$/.test(c.code)) fail(`bad country code: ${c.code}`)
  if (codes.has(c.code)) fail(`duplicate country: ${c.code}`)
  codes.add(c.code)
  if (!c.name) fail(`missing name: ${c.code}`)
  if (!Array.isArray(c.zones) || c.zones.length === 0) fail(`no zones: ${c.code}`)
  for (const z of c.zones ?? []) {
    if (!VALID_ZONES.has(z)) fail(`invalid zone "${z}" in ${c.code}`)
  }
  if (!VALID_HEM.has(c.hem)) fail(`invalid hem "${c.hem}" in ${c.code}`)
}

const ids = new Set()
const validMonths = (m) => Array.isArray(m) && m.length > 0 && m.every((x) => Number.isInteger(x) && x >= 1 && x <= 12)
for (const p of produce) {
  if (!p.id) fail(`missing id: ${JSON.stringify(p).slice(0, 60)}`)
  else if (ids.has(p.id)) fail(`duplicate produce id: ${p.id}`)
  ids.add(p.id)
  if (!p.name) fail(`missing name: ${p.id}`)
  if (!p.color) fail(`missing color: ${p.id}`)
  if (!p.wiki || !p.wiki.startsWith('https://en.wikipedia.org/wiki/')) {
    fail(`missing/invalid wiki URL: ${p.id}`)
  }
  if (!VALID_TYPES.has(p.type)) fail(`invalid type: ${p.id}`)
  if (!validMonths(p.months)) fail(`bad months: ${p.id}`)
  if (p.monthsSouth && !validMonths(p.monthsSouth)) fail(`bad monthsSouth: ${p.id}`)
  if (!Array.isArray(p.zones) || p.zones.length === 0) fail(`no zones: ${p.id}`)
  for (const z of p.zones ?? []) {
    if (!VALID_ZONES.has(z)) fail(`invalid zone "${z}" in ${p.id}`)
  }
  const iconPath = path.join(iconsDir, `${p.id}.svg`)
  if (!fs.existsSync(iconPath)) {
    fail(`missing icon src/assets/icons/${p.id}.svg (add to ICON_MAP or author a custom SVG)`)
  } else if (fs.statSync(iconPath).size < 40) {
    fail(`icon file suspiciously small: ${p.id}.svg`)
  }
}

let minFruit = Infinity
let minVeg = Infinity
let worstFruit = null
let worstVeg = null
const empty = []

for (const c of countries) {
  for (let m = 1; m <= 12; m++) {
    const fruits = getProduce(c.code, m, 'fruit').length
    const veg = getProduce(c.code, m, 'vegetable').length
    if (fruits < minFruit) {
      minFruit = fruits
      worstFruit = `${c.code} ${m}`
    }
    if (veg < minVeg) {
      minVeg = veg
      worstVeg = `${c.code} ${m}`
    }
    if (fruits === 0) empty.push(`fruit ${c.code} ${m}`)
    if (veg === 0) empty.push(`veg ${c.code} ${m}`)
  }
}

if (empty.length) {
  fail(`${empty.length} empty country/month/type combos, e.g.: ${empty.slice(0, 10).join('; ')}`)
}

console.log(`countries: ${countries.length}`)
console.log(`produce items: ${produce.length}`)
console.log(`min fruits per month: ${minFruit} (worst: ${worstFruit})`)
console.log(`min vegetables per month: ${minVeg} (worst: ${worstVeg})`)

// sanity spot-checks
const fr = getProduce('FR', 7, 'fruit').map((p) => p.id)
const au = getProduce('AU', 1, 'fruit').map((p) => p.id)
console.log(`FR July fruits: ${fr.join(', ')}`)
console.log(`AU January fruits: ${au.join(', ')}`)
if (!fr.includes('strawberry')) fail('FR July should include strawberry')
if (!au.includes('strawberry')) fail('AU January should include strawberry (southern summer)')

if (errors.length) {
  console.error(`\n${errors.length} issue(s):`)
  for (const e of errors.slice(0, 50)) console.error(`- ${e}`)
  process.exit(1)
}
console.log('\nOK')
