import type { Activity } from '../../types'
import { ActivityFilters } from './ActivityFilters'
import { ArrowRight } from 'lucide-react'
import { typeLabel } from '../../lib/presentation'

type Props = {
  activities: Activity[]
  loading: boolean
  activityFilter: string
  setActivityFilter: (value: string) => void
}

export function CalendarPage({
  activities,
  loading: catalogLoading,
  activityFilter,
  setActivityFilter,
}: Props) {
  return (
    <main className="page-content narrow-content">
      <div className="page-intro">
        <span className="eyebrow">Les dates à retenir</span>
        <h1>
          Le calendrier<span className="dot">.</span>
        </h1>
        <p>Un aperçu de nos prochains rendez-vous à Dakar.</p>
      </div>
      <ActivityFilters value={activityFilter} onChange={setActivityFilter} />
      {catalogLoading ? (
        <div className="loading-state" role="status">
          Chargement des dates…
        </div>
      ) : (
        <div className="calendar-list">
          {activities
            .filter((item) => activityFilter === 'ALL' || item.type === activityFilter)
            .map((item) => (
              <a className="calendar-row" href={`#/activity/${item.id}`} key={item.id}>
                <div className="calendar-date">
                  <span>
                    {new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(
                      new Date(item.startsAt),
                    )}
                  </span>
                  <small>
                    {new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(
                      new Date(item.startsAt),
                    )}
                  </small>
                </div>
                <div>
                  <span className="eyebrow">
                    {typeLabel(item.type)} · {item.location}
                  </span>
                  <h2>{item.title}</h2>
                </div>
                <ArrowRight size={17} />
              </a>
            ))}
        </div>
      )}
      {activities.length === 0 && (
        <div className="empty-state">Le calendrier sera bientôt mis à jour.</div>
      )}
    </main>
  )
}
