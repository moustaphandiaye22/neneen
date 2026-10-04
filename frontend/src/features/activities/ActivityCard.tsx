import { ArrowRight, CalendarDays, MapPin, MessageCircle, Users } from 'lucide-react'
import type { Activity } from '../../types'
import { dateLabel, money, photos, typeLabel } from '../../lib/presentation'

const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')

export function ActivityCard({ activity, index }: { activity: Activity; index: number }) {
  const spotsLeft = activity.capacity - activity.reserved
  const isScarce = spotsLeft > 0 && spotsLeft <= 5
  const isFull = spotsLeft <= 0

  const waText = encodeURIComponent(
    `Bonjour ! Je voudrais en savoir plus sur l'activité : ${activity.title}.`,
  )
  const waHref = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${waText}` : null

  return (
    <article className="activity-card" style={{ animationDelay: `${index * 70}ms` }}>
      {/* Image */}
      <a
        className="activity-image"
        href={`#/activity/${activity.id}`}
        style={{ backgroundImage: `url(${activity.imageUrl || photos[activity.type]})` }}
        aria-label={activity.title}
      >
        <span className="eyebrow light">{typeLabel(activity.type)}</span>
        <div className="image-arrow" aria-hidden="true">
          <ArrowRight size={15} />
        </div>
      </a>

      {/* Content */}
      <div className="activity-copy">
        <div className="activity-meta">
          <span>
            <CalendarDays size={13} />
            {dateLabel(activity.startsAt)}
          </span>
          <span>
            <MapPin size={13} />
            {activity.location}
          </span>
        </div>

        <a className="title-link" href={`#/activity/${activity.id}`}>
          {activity.title}
        </a>
        <p>{activity.description}</p>

        {/* Availability */}
        {(isScarce || isFull) && (
          <div className={`activity-spots ${isFull ? 'spots-full' : 'spots-scarce'}`}>
            <Users size={12} />
            {isFull
              ? 'Complet'
              : `${spotsLeft} place${spotsLeft > 1 ? 's' : ''} restante${spotsLeft > 1 ? 's' : ''}`}
          </div>
        )}

        <div className="activity-bottom">
          <div>
            <strong>
              {money(activity.price)}
              <small>/ pers.</small>
            </strong>
          </div>
          <div className="activity-bottom-actions">
            {waHref && (
              <a
                className="activity-wa-btn"
                href={waHref}
                target="_blank"
                rel="noreferrer"
                aria-label={`WhatsApp pour ${activity.title}`}
                title="Demander sur WhatsApp"
              >
                <MessageCircle size={14} />
              </a>
            )}
            <a
              className={`text-action${isFull ? ' action-waitlist' : ''}`}
              href={`#/booking/${activity.id}`}
            >
              {isFull ? "Liste d'attente" : 'Réserver'} <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}
