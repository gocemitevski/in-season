import { useEffect, useState } from 'react'
import { clearStoredLocation } from '../hooks/useLocation'
import { flagFromCode } from '../lib/season'

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

  return (
    <header className="sticky top-0 z-20 border-b border-leaf-200 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex flex-wrap max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold tracking-tight text-ink">
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
          <p className="mt-0.5 truncate text-xs text-ink/70">
            What&rsquo;s in season near you?
          </p>
        </div>

        <div className="shrink-0">
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
        </div>
      </div>
    </header>
  )
}
