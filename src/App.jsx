import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CategoryToggle from './components/CategoryToggle'
import Header from './components/Header'
import MonthChips from './components/MonthChips'
import ProduceGrid from './components/ProduceGrid'
import ShareLinks from './components/ShareLinks'
import { useLocation } from './hooks/useLocation'
import { detectCountry } from './lib/geo'
import { sendPageview } from './lib/ga'
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

  // Snapshot of the build-time state at first render. Shared-URL visitors
  // start with #root hidden (html.ssr-dim, see index.html) and must stay
  // hidden until the effects below have committed their ?c/?m/?t values.
  const firstLocationRef = useRef(location)
  const firstMonthRef = useRef(month)
  const firstCategoryRef = useRef(category)

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

  // Unhide only after URL-driven state differs from the prerendered snapshot
  // and has committed — the build-time content must never become visible for
  // visitors who arrived with ?c/?m/?t.
  useEffect(() => {
    if (
      location !== firstLocationRef.current ||
      month !== firstMonthRef.current ||
      category !== firstCategoryRef.current
    ) {
      document.documentElement.classList.remove('ssr-dim')
    }
  }, [location, month, category])

  const isLoading = status === 'loading' || !country
  const categoryLabel = category === 'fruit' ? 'fruits' : 'vegetables'
  const resultsHeading = isLoading ? (
    'Detecting your location…'
  ) : (
    <>
      <span className="font-bold">
        {items.length} {categoryLabel}
      </span>{' '}
      <span className="font-medium text-ink/70">in season in</span>{' '}
      <span className="font-bold">{country.name}</span>{' '}
      <span className="font-medium text-ink/70">during {MONTH_NAMES[month - 1]}</span>
    </>
  )

  return (
    <div className="min-h-dvh">
      <Header countries={COUNTRIES} country={country} onSelectCountry={handleSelectCountry} />

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6 sm:pt-12">
        <p className="max-w-2xl text-base leading-relaxed text-ink/85">
          Find which fruits and vegetables are in season this month in your country. Seasons
          follow climate zone and hemisphere for <strong>197</strong> countries.
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

        <div className="mt-16">
          <ShareLinks />
        </div>

        <footer className="mt-8 border-t border-leaf-200 pt-8 text-center text-xs leading-relaxed text-ink/70">
          <p>
            Seasonality is approximate and varies by region, altitude, and growing method.
          </p>
          <p className="mt-1">
            Built with MiMo 2.6 Flash, React, Tailwind &amp; web standards by{' '}
            <a
              href="https://gocemitevski.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-leaf-300 underline-offset-2 hover:text-leaf-800 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Goce Mitevski
            </a>.
          </p>
          <p className="mt-3">
            <a
              href="https://github.com/gocemitevski/in-season"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-leaf-200 bg-white px-3 py-1 text-xs font-semibold text-ink/70 transition duration-200 hover:border-leaf-400 hover:bg-leaf-50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              Fork me on GitHub
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
