import { MONTH_NAMES, MONTH_NAMES_SHORT } from '../lib/season'

export default function MonthChips({ month, onChange }) {
  return (
    <div
      className="-mx-4 flex flex-wrap gap-2.5 px-4 pb-1 sm:mx-0 sm:px-0"
      role="group"
      aria-label="Select month"
    >
      {MONTH_NAMES_SHORT.map((label, index) => {
        const value = index + 1
        const selected = value === month
        return (
          <button
            key={label}
            type="button"
            aria-pressed={selected}
            title={MONTH_NAMES[index]}
            onClick={() => onChange(value)}
            className={[
              'min-w-12 flex-1 cursor-pointer rounded-full px-4 py-2 text-center text-sm font-medium transition active:scale-95',
              selected
                ? 'bg-leaf-600 text-white shadow-sm shadow-leaf-600/25'
                : 'border border-leaf-300 bg-white text-ink/80 hover:border-leaf-400 hover:bg-leaf-50',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
