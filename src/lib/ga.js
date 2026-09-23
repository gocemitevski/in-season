import ReactGA from 'react-ga4'

const GA_ID = import.meta.env.VITE_GA_ID

let initialized = false

export function initAnalytics() {
  if (initialized) return
  if (import.meta.env.DEV || !GA_ID || typeof window === 'undefined') return
  // Disable gtag's auto page_view; App sends it manually after hydration
  // with the full ?c=&m=&t= URL state.
  ReactGA.initialize(GA_ID, { gaOptions: { send_page_view: false } })
  initialized = true
}

export function sendPageview(path) {
  if (!initialized) return
  ReactGA.send({ hitType: 'pageview', page: path, title: document.title })
}
