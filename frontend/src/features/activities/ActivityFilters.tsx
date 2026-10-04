type ActivityFiltersProps = {
  value: string
  onChange: (value: string) => void
}

const filters = [
  ['ALL', 'Tout'],
  ['EXCURSION', 'Excursions'],
  ['AFTERWORK', 'Soirées après le travail'],
  ['EVENT', 'Événements'],
] as const

export function ActivityFilters({ value, onChange }: ActivityFiltersProps) {
  return (
    <div className="filter-row" role="group" aria-label="Filtrer les sorties">
      {filters.map(([option, label]) => (
        <button
          type="button"
          className={value === option ? 'filter-button active' : 'filter-button'}
          aria-pressed={value === option}
          key={option}
          onClick={() => onChange(option)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
