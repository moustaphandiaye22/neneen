import type { Activity } from '../../types'
import { ActivityFilters } from './ActivityFilters'
import { ActivityCard } from './ActivityCard'

type Props = {
  activities: Activity[]
  loading: boolean
  activityFilter: string
  setActivityFilter: (value: string) => void
}

export function ActivitiesPage({
  activities,
  loading: catalogLoading,
  activityFilter,
  setActivityFilter,
}: Props) {
  return (
    <main className="page-content">
      <div className="page-intro">
        <span className="eyebrow">Le calendrier neneen</span>
        <h1>
          On se retrouve <em>bientôt.</em>
        </h1>
        <p>Choisissez votre prochaine expérience au départ de Dakar.</p>
      </div>
      <ActivityFilters value={activityFilter} onChange={setActivityFilter} />
      {catalogLoading ? (
        <div className="loading-state" role="status">
          Chargement du programme…
        </div>
      ) : (
        <div className="activity-grid">
          {activities
            .filter((item) => activityFilter === 'ALL' || item.type === activityFilter)
            .map((activity, index) => (
              <ActivityCard activity={activity} index={index} key={activity.id} />
            ))}
        </div>
      )}
      {activities.length === 0 && (
        <div className="empty-state">Aucune activité publiée pour le moment.</div>
      )}
    </main>
  )
}
