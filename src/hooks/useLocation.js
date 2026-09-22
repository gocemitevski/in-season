import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'inseason:location'
const FALLBACK_CODE = 'US'

function readStored(isKnownCode) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.code === 'string' && isKnownCode(parsed.code)) {
      return {
        code: parsed.code,
        source: typeof parsed.source === 'string' ? parsed.source : 'manual',
      }
    }
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
  return null
}

function writeStored(location) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location))
  } catch {
    /* private mode etc. */
  }
}

function readUrlCountry(isKnownCode) {
  try {
    const code = new URLSearchParams(window.location.search).get('c')
    if (code && isKnownCode(code.toUpperCase())) {
      return code.toUpperCase()
    }
  } catch {
    /* ignore */
  }
  return null
}

function toResolved(result, isKnownCode) {
  if (result?.code && isKnownCode(result.code)) {
    return { code: result.code, source: result.source ?? 'ip', persist: true }
  }
  return { code: FALLBACK_CODE, source: 'default', persist: false }
}

export function useLocation({ detect, isKnownCode, initial }) {
  const [location, setLocation] = useState(() => {
    if (initial?.location) return initial.location
    return readStored(isKnownCode)
  })
  const [status, setStatus] = useState(() => {
    if (initial?.location) return 'ready'
    return location ? 'ready' : 'loading'
  })
  const userSelectedRef = useRef(false)

  useEffect(() => {
    const fromUrl = readUrlCountry(isKnownCode)
    if (fromUrl) {
      // Shared-link country applies to this visit only — never persist it,
      // so a later bare visit can still run IP/locale detection.
      setLocation({ code: fromUrl, source: 'url' })
      setStatus('ready')
      userSelectedRef.current = true
      return undefined
    }

    const stored = readStored(isKnownCode)
    if (stored && stored.source !== 'default') {
      setLocation(stored)
      setStatus('ready')
      return undefined
    }

    const controller = new AbortController()
    let stale = false

    const apply = (resolved) => {
      if (stale || userSelectedRef.current) return
      const next = { code: resolved.code, source: resolved.source }
      if (resolved.persist) writeStored(next)
      setLocation(next)
      setStatus('ready')
    }

    Promise.resolve()
      .then(() => detect({ isKnownCode, signal: controller.signal }))
      .then((result) => apply(toResolved(result, isKnownCode)))
      .catch(() => apply({ code: FALLBACK_CODE, source: 'default', persist: false }))

    return () => {
      stale = true
      controller.abort()
    }
  }, [detect, isKnownCode])

  const setCountry = useCallback(
    (code, source = 'manual') => {
      if (!isKnownCode(code)) return
      userSelectedRef.current = true
      const next = { code, source }
      writeStored(next)
      setLocation(next)
      setStatus('ready')
    },
    [isKnownCode],
  )

  return { location, status, setCountry }
}
