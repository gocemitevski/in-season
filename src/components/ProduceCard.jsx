import { seasonSummary } from '../lib/season'

const iconUrls = import.meta.glob('/src/assets/icons/*.svg', {
  eager: true,
  import: 'default',
})

function iconSrc(id) {
  return iconUrls[`/src/assets/icons/${id}.svg`] ?? null
}

export default function ProduceCard({ item, country }) {
  const tint = `${item.color}1a`
  const src = iconSrc(item.id)

  return (
    <article className="relative flex h-full flex-col gap-4 rounded-2xl border border-leaf-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className="flex size-14 shrink-0 items-center justify-center self-start rounded-xl"
        style={{ backgroundColor: tint }}
        aria-hidden="true"
      >
        {src ? (
          <img src={src} alt="" className="h-10 w-10 object-contain" />
        ) : item.emoji ? (
          <span className="text-3xl leading-none">{item.emoji}</span>
        ) : (
          <span className="text-xl font-bold" style={{ color: item.color }}>
            {item.name.charAt(0)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-ink">
          <a
            href={item.wiki}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xs outline-offset-2 after:absolute after:inset-0 focus-visible:outline-2"
          >
            {item.name}
          </a>
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-ink/65">
          {seasonSummary(country, item)}
        </p>
      </div>
    </article>
  )
}
