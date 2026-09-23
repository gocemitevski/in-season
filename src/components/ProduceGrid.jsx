import ProduceCard from './ProduceCard'

export default function ProduceGrid({ items, country }) {
  if (items.length === 0) {
    return (
      <div className="animate-fade-in rounded-3xl border border-dashed border-leaf-200 bg-white/60 px-6 py-16 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-leaf-100 text-2xl">
          🧺
        </div>
        <p className="text-sm font-semibold text-ink">Nothing listed for this month</p>
        <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-ink/65">
          Try another month, switch category, or pick a different country.
        </p>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item, index) => (
        <li
          key={item.id}
          className="animate-card-in"
          style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
        >
          <ProduceCard item={item} country={country} />
        </li>
      ))}
    </ul>
  )
}
