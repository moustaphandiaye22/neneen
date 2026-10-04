import { ArrowDownRight, ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import type { Activity } from '../../types'
import { dateLabel, money, photos, typeLabel } from '../../lib/presentation'

export function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  return (
    <article
      className="activity-card"
      key={activity.id}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <a
        className="activity-image"
        href={`#/activity/${activity.id}`}
        style={{ backgroundImage: `url(${activity.imageUrl || photos[activity.type]})` }}
      >
        <span className="eyebrow light">{typeLabel(activity.type)}</span>
        <ArrowDownRight className="image-arrow" size={19} />
      </a>
      <div className="activity-copy">
        <div className="activity-meta">
          <span>
            <CalendarDays size={14} />
            {dateLabel(activity.startsAt)}
          </span>
          <span>
            <MapPin size={14} />
            {activity.location}
          </span>
        </div>
        <a className="title-link" href={`#/activity/${activity.id}`}>
          {activity.title}
        </a>
        <p>{activity.description}</p>
        <div className="activity-bottom">
          <strong>
            {money(activity.price)}
            <small>/ personne</small>
          </strong>
          <a className="text-action" href={`#/booking/${activity.id}`}>
            Réserver <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </article>
  )
}
