// Cookieless Matomo tracker. The filename deliberately avoids "analytics" and
// "matomo" so generic ad-block rules don't break `npm run dev`.
const BASE = 'https://analytics.gocemitevski.com/'
const SITE_ID = '4'

let initialized = false

export function initAnalytics() {
  if (initialized) return
  if (import.meta.env.DEV || typeof window === 'undefined') return

  const w = window
  w._paq = w._paq || []
  // disableCookies must run before any trackPageView so no _pk_* cookie is
  // ever written — this is what makes the tracking cookieless.
  w._paq.push(['setTrackerUrl', BASE + 'matomo.php'])
  w._paq.push(['setSiteId', SITE_ID])
  w._paq.push(['disableCookies'])
  w._paq.push(['discardHashTag', true])
  w._paq.push(['enableLinkTracking'])
  // No initial trackPageView: App sends the first pageview after hydration
  // with the full ?c=&m=&t= URL state, so this would double-count.
  const g = document.createElement('script')
  const s = document.getElementsByTagName('script')[0]
  g.async = true
  g.src = BASE + 'matomo.js'
  s.parentNode.insertBefore(g, s)

  initialized = true
}

export function sendPageview(path) {
  if (!initialized) return
  window._paq.push(['setCustomUrl', path])
  // trackPageView accepts the document title as its optional first argument
  window._paq.push(['trackPageView', document.title])
}
