import countriesData from '../data/countries.json' with { type: 'json' }
import produceData from '../data/produce.json' with { type: 'json' }

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const MONTH_NAMES_SHORT = MONTH_NAMES.map((name) => name.slice(0, 3))

export const COUNTRIES = [...countriesData].sort((a, b) => a.name.localeCompare(b.name))

const countriesByCode = new Map(countriesData.map((c) => [c.code, c]))

export function getCountry(code) {
  if (!code) return null
  return countriesByCode.get(code.toUpperCase()) ?? null
}

export function flagFromCode(code) {
  if (!code || code.length !== 2) return ''
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split('')
      .map((ch) => 127397 + ch.charCodeAt(0)),
  )
}

function shiftMonths(months, by) {
  return months.map((m) => ((m - 1 + by) % 12) + 1)
}

function monthsFor(country, item) {
  if (country.hem === 's') {
    return item.monthsSouth ?? shiftMonths(item.months, 6)
  }
  return item.months
}

function matchesZones(country, item) {
  return Array.isArray(item.zones) && item.zones.some((z) => country.zones.includes(z))
}

export function getProduce(countryCode, month, type) {
  const country = getCountry(countryCode)
  if (!country || month < 1 || month > 12) return []
  return produceData.filter(
    (item) => item.type === type && matchesZones(country, item) && monthsFor(country, item).includes(month),
  )
}

export function seasonSummary(country, item) {
  const months = [...monthsFor(country, item)].sort((a, b) => a - b)
  if (months.length === 12) return 'Year-round'
  if (months.length === 0) return ''
  const runs = []
  let start = months[0]
  let prev = months[0]
  for (let i = 1; i <= months.length; i++) {
    const m = months[i]
    if (m === undefined || m !== prev + 1) {
      runs.push([start, prev])
      start = m
    }
    prev = m
  }
  // A sorted run that starts in January and ends in December wraps the year
  // (e.g. Dec–Feb) — merge the last and first runs into one circular range.
  if (months[0] === 1 && months[months.length - 1] === 12 && runs.length > 1) {
    const first = runs[0]
    const last = runs[runs.length - 1]
    runs.pop()
    runs.shift()
    runs.unshift([last[0], first[1]])
  }
  return runs
    .map(([s, e]) =>
      s === e ? MONTH_NAMES_SHORT[s - 1] : `${MONTH_NAMES_SHORT[s - 1]} – ${MONTH_NAMES_SHORT[e - 1]}`,
    )
    .join(', ')
}

export function isCountryCode(code) {
  return getCountry(code) !== null
}
