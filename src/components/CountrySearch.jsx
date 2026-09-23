import { useEffect, useMemo, useRef, useState } from 'react'
import { flagFromCode } from '../lib/season'

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/['’ʼ´]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export default function CountrySearch({ countries, country, onSelect }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const dialogRef = useRef(null)
  const inputRef = useRef(null)
  const pressedBackdrop = useRef(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) dialog.showModal()
      inputRef.current?.focus()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [open])

  const normalizedQuery = normalize(query.trim())
  const results = useMemo(() => {
    if (!normalizedQuery) return countries
    const matches = countries.filter(
      (item) =>
        normalize(item.name).includes(normalizedQuery) ||
        item.code.toLowerCase().includes(normalizedQuery),
    )
    // Exact ISO-code matches first (e.g. "us" → United States, not Austria).
    return [
      ...matches.filter((item) => item.code.toLowerCase() === normalizedQuery),
      ...matches.filter((item) => item.code.toLowerCase() !== normalizedQuery),
    ]
  }, [countries, normalizedQuery])

  const openDialog = () => {
    setQuery('')
    setOpen(true)
  }

  const choose = (code) => {
    setOpen(false)
    onSelect(code)
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-leaf-200 bg-white text-ink/70 shadow-sm transition duration-200 hover:border-leaf-400 hover:bg-leaf-50 hover:text-ink active:scale-95"
        aria-label="Search country"
        aria-haspopup="dialog"
        onClick={openDialog}
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20.5 20.5-4-4" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        className="country-search-dialog"
        aria-labelledby="country-search-title"
        onClose={() => setOpen(false)}
        // The dialog spans the viewport; a press on the scrim that also
        // releases on the scrim is a backdrop click → dismiss. Deciding on
        // pointerup's real target (not click's common ancestor) keeps a
        // drag from the scrim onto the panel from closing the dialog.
        onPointerDown={(event) => {
          pressedBackdrop.current = event.target === event.currentTarget
        }}
        onPointerUp={(event) => {
          if (pressedBackdrop.current && event.target === event.currentTarget) {
            event.currentTarget.close()
          }
        }}
      >
        <div className="country-search-panel animate-fade-in">
          <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
            <h2 id="country-search-title" className="text-base font-bold tracking-tight">
              Select country
            </h2>
            <button
              type="button"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink/50 transition hover:bg-leaf-50 hover:text-ink"
              aria-label="Close"
              onClick={() => dialogRef.current?.close()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className="px-5 pb-3">
            <input
              ref={inputRef}
              type="search"
              autoComplete="off"
              spellCheck="false"
              aria-label="Search countries"
              placeholder="Type a country name…"
              className="w-full rounded-full border border-leaf-200 bg-cream/60 px-4 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-leaf-400 focus:bg-white focus:outline-none"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                // Only commit the highlighted first match — never a country
                // picked from a fresh, unfiltered list.
                if (event.key === 'Enter' && normalizedQuery) {
                  const first = results[0]
                  if (first) {
                    event.preventDefault()
                    choose(first.code)
                  }
                }
                // Chrome spends the first Esc clearing type=search inputs;
                // close the dialog instead.
                if (event.key === 'Escape') {
                  event.preventDefault()
                  dialogRef.current?.close()
                }
              }}
            />
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
            {results.map((item, index) => {
              const selected = item.code === country?.code
              const active = Boolean(normalizedQuery) && index === 0
              return (
                <li key={item.code}>
                  <button
                    type="button"
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink transition hover:bg-leaf-50 ${
                      active ? 'bg-leaf-50 font-medium' : ''
                    }`}
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => choose(item.code)}
                  >
                    <span aria-hidden="true" className="leading-none">
                      {flagFromCode(item.code)}
                    </span>
                    <span className="flex-1 truncate">{item.name}</span>
                    {selected && (
                      <span aria-hidden="true" className="font-bold text-leaf-600">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
            {results.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-ink/50">
                No countries match “{query.trim()}”.
              </li>
            )}
          </ul>

          <p aria-live="polite" className="sr-only">
            {results.length === countries.length
              ? `${countries.length} countries`
              : `${results.length} of ${countries.length} countries match`}
          </p>
        </div>
      </dialog>
    </>
  )
}
