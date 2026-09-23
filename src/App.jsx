import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CategoryToggle from './components/CategoryToggle'
import Header from './components/Header'
import MonthChips from './components/MonthChips'
import ProduceGrid from './components/ProduceGrid'
import { useLocation } from './hooks/useLocation'
import { detectCountry } from './lib/geo'
import { sendPageview } from './lib/analytics'
import {
  COUNTRIES,
  MONTH_NAMES,
  getCountry,
  getProduce,
  isCountryCode,
} from './lib/season'

const DEFAULT_TITLE = 'In Season — fruits & vegetables by month and country'

function readUrlMonth() {
  try {
    const raw = new URLSearchParams(window.location.search).get('m')
    const month = Number(raw)
    if (Number.isInteger(month) && month >= 1 && month <= 12) return month
  } catch {
    /* ignore */
  }
  return null
}

function readUrlCategory() {
  try {
    const raw = new URLSearchParams(window.location.search).get('t')
    if (!raw) return null
    const value = raw.toLowerCase()
    if (value === 'fruit' || value === 'fruits') return 'fruit'
    if (value === 'vegetable' || value === 'vegetables') return 'vegetable'
  } catch {
    /* ignore */
  }
  return null
}

function SkeletonGrid() {
  return (
    <ul
      className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      aria-hidden="true"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <li
          key={i}
          className="h-36 animate-pulse rounded-2xl border border-leaf-200 bg-white/70"
        />
      ))}
    </ul>
  )
}

function setMetaContent(selector, content) {
  const el = document.querySelector(selector)
  if (el) el.setAttribute('content', content)
}

function setLinkHref(selector, href) {
  const el = document.querySelector(selector)
  if (el) el.setAttribute('href', href)
}

export default function App({ initialState }) {
  const { location, status, setCountry } = useLocation({
    detect: detectCountry,
    isKnownCode: isCountryCode,
    initial: initialState,
  })
  const [month, setMonth] = useState(
    () => initialState?.month ?? readUrlMonth() ?? new Date().getMonth() + 1,
  )
  const [category, setCategory] = useState(
    () => initialState?.category ?? readUrlCategory() ?? 'fruit',
  )
  const lastPageviewRef = useRef(null)

  const country = getCountry(location?.code)
  const items = useMemo(
    () => (country ? getProduce(country.code, month, category) : []),
    [country, month, category],
  )

  const handleSelectCountry = useCallback(
    (code) => setCountry(code, 'manual'),
    [setCountry],
  )

  // oxlint-disable react/set-state-in-effect -- URL state must apply only after
  // hydration; reading it during render would mismatch the prerendered HTML.
  useEffect(() => {
    // Apply URL month/category only on mount (after hydration); never re-read
    // on later changes or we race the write effect and revert clicks.
    const fromUrlMonth = readUrlMonth()
    if (fromUrlMonth) {
      setMonth(fromUrlMonth)
    } else if (!new URLSearchParams(window.location.search).has('m')) {
      setMonth(new Date().getMonth() + 1)
    }

    const fromUrlCategory = readUrlCategory()
    if (fromUrlCategory) setCategory(fromUrlCategory)
  }, [])
  // oxlint-enable react/set-state-in-effect

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // Omit `c` for the implicit fallback (source 'default') so a reload does
    // not turn the fallback into an explicit, sticky URL choice.
    if (country && location?.source !== 'default') params.set('c', country.code)
    else params.delete('c')
    params.set('m', String(month))
    params.set('t', category)
    const search = params.toString()
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}`
    // Canonical / og:url stay query-free so they match the sitemap and do not
    // vary per visitor (c/m/t remain shareable state only).
    const pageUrl = window.location.origin + window.location.pathname

    window.history.replaceState(null, '', nextUrl)

    const categoryLabel = category === 'fruit' ? 'fruits' : 'vegetables'
    const title = country
      ? `${items.length} ${categoryLabel} in season in ${country.name} · ${MONTH_NAMES[month - 1]} — In Season`
      : DEFAULT_TITLE
    document.title = title

    // Virtual pageview for each shareable URL state (load + filter changes).
    // Skip while location is still resolving and dedupe consecutive sends.
    if (status !== 'loading' && country && lastPageviewRef.current !== nextUrl) {
      lastPageviewRef.current = nextUrl
      sendPageview(nextUrl)
    }

    setLinkHref('link[rel="canonical"]', pageUrl)
    setMetaContent('meta[property="og:url"]', pageUrl)
    setMetaContent('meta[property="og:title"]', title)
    setMetaContent('meta[name="twitter:title"]', title)

    const description = country
      ? `${items.length} ${categoryLabel} in season in ${country.name} in ${MONTH_NAMES[month - 1]}. Check monthly seasonal produce for fruits and vegetables.`
      : document
          .querySelector('meta[name="description"]')
          ?.getAttribute('content') ?? ''
    if (description) {
      setMetaContent('meta[name="description"]', description)
      setMetaContent('meta[property="og:description"]', description)
      setMetaContent('meta[name="twitter:description"]', description)
    }

    const ld = document.querySelector('script[type="application/ld+json"]')
    if (ld && country) {
      ld.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'In Season',
            description: `Seasonal fruits and vegetables in ${country.name} by month.`,
            url: pageUrl,
            applicationCategory: 'FoodApplication',
            operatingSystem: 'Any',
            inLanguage: 'en',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          },
          {
            '@type': 'ItemList',
            name: `${items.length} ${categoryLabel} in season in ${country.name} · ${MONTH_NAMES[month - 1]}`,
            numberOfItems: items.length,
            itemListElement: items.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'Thing',
                name: item.name,
                url: item.wiki,
              },
            })),
          },
        ],
      })
    }
  }, [country, location, month, category, items, status])

  const isLoading = status === 'loading' || !country
  const categoryLabel = category === 'fruit' ? 'fruits' : 'vegetables'
  const resultsHeading = isLoading ? (
    'Detecting your location…'
  ) : (
    <>
      <span className="font-bold">
        {items.length} {categoryLabel}
      </span>{' '}
      <span className="font-medium text-ink/60">in season in</span>{' '}
      <span className="font-bold">{country.name}</span>{' '}
      <span className="font-medium text-ink/60">during {MONTH_NAMES[month - 1]}</span>
    </>
  )

  return (
    <div className="min-h-dvh">
      <Header countries={COUNTRIES} country={country} onSelectCountry={handleSelectCountry} />

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6 sm:pt-12">
        <p className="max-w-2xl text-sm leading-relaxed text-ink/75">
          Find which fruits and vegetables are in season this month in your country. Seasons
          follow climate zone and hemisphere for 197 countries.
        </p>

        <section className="mt-8 space-y-5" aria-label="Filters">
          <MonthChips month={month} onChange={setMonth} />
          <CategoryToggle value={category} onChange={setCategory} />
        </section>

        <section className="mt-12" aria-live="polite" aria-busy={isLoading}>
          <h2
            key={isLoading ? 'loading' : `${country?.code}-${month}-${category}`}
            className="mb-5 animate-fade-in px-1 text-xl font-semibold tracking-tight text-ink sm:px-3 sm:text-xl"
          >
            {resultsHeading}
          </h2>
          {isLoading ? <SkeletonGrid /> : <ProduceGrid items={items} country={country} />}
        </section>

        <footer className="mt-20 border-t border-leaf-200 pt-8 text-center text-xs leading-relaxed text-ink/60">
          <p>
            Seasonality is approximate and varies by region, altitude, and growing method.
          </p>
          <p className="mt-1">Built with React &amp; web standards.</p>
        </footer>
      </main>
    </div>
  )
}
