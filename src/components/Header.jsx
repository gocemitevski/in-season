import { useEffect, useLayoutEffect, useState } from 'react'
import CountrySearch from './CountrySearch'
import { clearStoredLocation } from '../hooks/useLocation'
import { flagFromCode } from '../lib/season'

function flagSrc(code) {
  return `https://flagcdn.com/w640/${code.toLowerCase()}.png`
}

// The decorative flag is the page's LCP image, but its URL only exists once
// the country is known — never in the prerendered HTML. Preload it from a
// real <link> before React inserts the <img> so the request is discovered in
// the document (and hint it high) instead of being started by the render.
function preloadFlag(src) {
  document.querySelector('link[data-flag-preload]')?.remove()
  if (!src) return
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = src
  link.setAttribute('fetchpriority', 'high')
  link.setAttribute('data-flag-preload', '')
  document.head.append(link)
}

export default function Header({
  countries,
  country,
  onSelectCountry,
}) {
  // Customizable-select markup (<button>/<selectedcontent> inside <select>) is
  // stripped by classic HTML parsers, so prerendered HTML cannot hydrate it.
  // Render the select client-side only; first client render matches SSR (absent).
  const [selectReady, setSelectReady] = useState(false)
  // oxlint-disable-next-line react/set-state-in-effect -- flip to client-only after hydration
  useEffect(() => setSelectReady(true), [])

  const flag = country ? flagSrc(country.code) : null
  // Gate the flag on its preload link: <head> gets the <link> before React
  // inserts the <img>, so the request starts at commit time (as when the img
  // rendered directly) instead of when the render that adds it happens to run.
  // A layout effect keeps both commits inside one paint — no late pop-in.
  const [preloadedFlag, setPreloadedFlag] = useState(null)
  useLayoutEffect(() => {
    if (preloadedFlag === flag) return
    preloadFlag(flag)
    // oxlint-disable-next-line react/set-state-in-effect -- commit the flag src after its preload link exists
    setPreloadedFlag(flag)
  }, [flag, preloadedFlag])

  return (
    <header className="sticky top-0 z-20 overflow-hidden border-b border-leaf-200 bg-cream/90 backdrop-blur-md">
      <div className="relative mx-auto flex flex-wrap max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight text-ink">
              <a
                href="./"
                onClick={() => clearStoredLocation()}
                className="inline-flex items-center gap-2 rounded-xs text-ink outline-offset-2 hover:text-leaf-800 focus-visible:outline-2"
              >
                <span aria-hidden="true" className="text-xl">
                  🌿
                </span>
                In Season
              </a>
            </h1>
          </div>
        </div>

        <div className="relative flex shrink-0 items-center gap-2">
          {preloadedFlag && (
            <img
              key={preloadedFlag}
              src={preloadedFlag}
              fetchPriority="high"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[16rem] max-w-none -translate-x-1/2 -translate-y-1/2 blur-3xl opacity-15 select-none sm:w-[24rem]"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
          )}
          <label htmlFor="country-select" className="sr-only">
            Country
          </label>
          {selectReady && (
            <select
              id="country-select"
              className="country-select max-w-full items-center"
              value={country?.code ?? ''}
              onChange={(event) => onSelectCountry(event.target.value)}
            >
              <button
                type="button"
                className="country-select-button"
                tabIndex={-1}
                aria-hidden="true"
                suppressHydrationWarning
              >
                <selectedcontent className="country-select-selected" suppressHydrationWarning>
                  {country && (
                    <>
                      <span aria-hidden="true" className="country-select-flag">
                        {flagFromCode(country.code)}
                      </span>{' '}
                      <span className="country-select-name">{country.name}</span>
                    </>
                  )}
                </selectedcontent>
              </button>
              {!country && (
                <option value="" disabled>
                  Detecting…
                </option>
              )}
              {countries.map((item) => (
                <option key={item.code} value={item.code}>
                  <span aria-hidden="true" className="country-select-flag">
                    {flagFromCode(item.code)}
                  </span>{' '}
                  <span className="country-select-name">{item.name}</span>
                </option>
              ))}
            </select>
          )}
          <CountrySearch
            countries={countries}
            country={country}
            onSelect={onSelectCountry}
          />
        </div>
      </div>
    </header>
  )
}
