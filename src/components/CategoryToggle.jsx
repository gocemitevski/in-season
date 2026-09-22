const OPTIONS = [
  { id: 'fruit', label: 'Fruits' },
  { id: 'vegetable', label: 'Vegetables' },
]

export default function CategoryToggle({ value, onChange }) {
  return (
    <div
      className="grid grid-cols-1 gap-1.5 rounded-2xl bg-leaf-200 p-1.5 min-[360px]:grid-cols-2"
      role="group"
      aria-label="Choose category"
    >
      {OPTIONS.map((option) => {
        const selected = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={[
              'flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold uppercase tracking-wide transition active:scale-[0.98]',
              selected
                ? 'bg-white text-ink shadow-sm'
                : 'text-ink/70 hover:text-ink',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
