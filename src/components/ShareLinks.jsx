import { useState } from 'react'

const FALLBACK_TITLE = 'In Season — fruits & vegetables by month and country'

function currentShare() {
  const url = window.location.origin + window.location.pathname + window.location.search
  const title = document.title || FALLBACK_TITLE
  return { url, title }
}

const LINKS = [
  {
    label: 'X',
    build: (url, title) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    label: 'Facebook',
    build: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    label: 'WhatsApp',
    build: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
  {
    label: 'Reddit',
    build: (url, title) =>
      `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
  {
    label: 'LinkedIn',
    build: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    label: 'Email',
    build: (url, title) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n\n${url}`)}`,
  },
]

const PILL =
  'cursor-pointer rounded-full border border-leaf-200 bg-white px-3 py-1 text-xs font-semibold text-ink/70 transition duration-200 hover:border-leaf-400 hover:bg-leaf-50 hover:text-ink active:scale-95'

export default function ShareLinks() {
  const [copied, setCopied] = useState(false)

  const open = (build) => () => {
    const { url, title } = currentShare()
    window.open(build(url, title), '_blank', 'noopener,noreferrer,width=600,height=560')
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentShare().url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable (permissions/private mode) */
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Share this view">
      <span className="text-xs font-medium text-ink/70">Share:</span>
      {LINKS.map((link) => (
        <button key={link.label} type="button" className={PILL} onClick={open(link.build)}>
          {link.label}
        </button>
      ))}
      <button type="button" className={PILL} onClick={copy}>
        <span aria-live="polite">{copied ? 'Copied!' : 'Copy link'}</span>
      </button>
    </div>
  )
}
