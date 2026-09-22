const IP_ENDPOINT = 'https://ipwho.is/'
const TIMEOUT_MS = 6000

async function countryFromIp(signal) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)
  try {
    const res = await fetch(IP_ENDPOINT, { signal: controller.signal })
    if (!res.ok) return null
    const data = await res.json()
    if (data?.success === false) return null
    const code = data?.country_code
    return typeof code === 'string' && code.length === 2 ? code.toUpperCase() : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

function countryFromLocale() {
  const locales = [navigator.language, ...(navigator.languages ?? [])]
  for (const tag of locales) {
    if (!tag) continue
    try {
      const region = new Intl.Locale(tag).region
      if (region && region.length === 2) return region.toUpperCase()
    } catch {
      const match = /[-_]([A-Za-z]{2})$/.exec(tag)
      if (match) return match[1].toUpperCase()
    }
  }
  return null
}

export async function detectCountry({ isKnownCode, signal } = {}) {
  const fromIp = await countryFromIp(signal)
  if (fromIp && isKnownCode(fromIp)) {
    return { code: fromIp, source: 'ip' }
  }
  const fromLocale = countryFromLocale()
  if (fromLocale && isKnownCode(fromLocale)) {
    return { code: fromLocale, source: 'locale' }
  }
  return { code: null, source: 'unknown' }
}
