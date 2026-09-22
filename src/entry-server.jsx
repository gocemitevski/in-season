import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'

export function render(initialState) {
  return renderToString(createElement(App, { initialState }))
}
