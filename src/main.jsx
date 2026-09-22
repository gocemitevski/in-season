import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initAnalytics } from './lib/analytics'

initAnalytics()

const rootEl = document.getElementById('root')
const initialState = window.__INITIAL_STATE__ ?? undefined
const prerendered = Boolean(initialState && rootEl.querySelector('.min-h-dvh'))

const app = (
  <StrictMode>
    <App initialState={initialState} />
  </StrictMode>
)

if (prerendered) {
  hydrateRoot(rootEl, app)
} else {
  createRoot(rootEl).render(app)
}
