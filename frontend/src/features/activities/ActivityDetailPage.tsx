import type { Activity } from '../../types'
import { dateLabel, money, photos, typeLabel } from '../../lib/presentation'
import {
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  ChevronLeft,
  MessageCircle,
  Info,
} from 'lucide-react'

interface ActivityDetailPageProps {
  activity: Activity
  whatsappNumber: string
}

export function ActivityDetailPage({ activity, whatsappNumber }: ActivityDetailPageProps) {
  const spotsLeft = activity.capacity - activity.reserved
  const isFull = spotsLeft <= 0
  const isScarce = spotsLeft > 0 && spotsLeft <= 5

  return (
    <main className="page-content detail-page">
      <a className="back-link" href="#/activities">
        <ChevronLeft size={15} />
        Toutes les sorties
      </a>

      {/* Hero Photo */}
      <div
        className="detail-photo"
        style={{ backgroundImage: `url(${activity.imageUrl || photos[activity.type]})` }}
      >
        <div className="detail-photo-overlay">
          <span className="eyebrow light">{typeLabel(activity.type)}</span>
          <div className="detail-photo-meta">
            <span>
              <Calendar size={14} /> {dateLabel(activity.startsAt)}
            </span>
            <span>
              <MapPin size={14} /> {activity.location}
            </span>
          </div>
        </div>
      </div>

      <div className="detail-layout">
        {/* Main Content */}
        <div className="detail-main">
          <div className="detail-header">
            <span className="eyebrow">
              <MapPin size={12} /> {activity.location}
            </span>
            <h1>{activity.title}</h1>
            <p className="detail-description">{activity.description}</p>
          </div>

          {activity.duration && (
            <div className="detail-info-chip">
              <Clock size={16} />
              <div>
                <span className="eyebrow">Durée</span>
                <strong>{activity.duration}</strong>
              </div>
            </div>
          )}

          {activity.schedule?.length > 0 && (
            <section className="detail-section">
              <h2>Le programme</h2>
              <ol className="itinerary-list">
                {activity.schedule.map((step, index) => (
                  <li key={`${step}-${index}`}>{step}</li>
                ))}
              </ol>
            </section>
          )}

          {activity.included?.length > 0 && (
            <section className="detail-section">
              <h2>Inclus dans votre réservation</h2>
              <ul className="included-list">
                {activity.included.map((item) => (
                  <li key={item}>
                    <CheckCircle size={14} className="included-icon" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {activity.bringList && (
            <section className="detail-section">
              <h2>À prévoir</h2>
              <div className="bring-list-card">
                <Info size={16} />
                <p>{activity.bringList}</p>
              </div>
            </section>
          )}
        </div>

        {/* Booking Sidebar */}
        <aside className="booking-card">
          <div className="booking-card-top">
            <span className="eyebrow">Votre prochaine sortie</span>
            <strong className="large-price">{money(activity.price)}</strong>
            <span className="muted">par personne</span>
          </div>

          <div
            className={`spots-badge ${isFull ? 'spots-full' : isScarce ? 'spots-scarce' : 'spots-ok'}`}
          >
            <Users size={13} />
            {isFull
              ? "Complet — liste d'attente disponible"
              : isScarce
                ? `Plus que ${spotsLeft} place${spotsLeft > 1 ? 's' : ''} !`
                : `${spotsLeft} places disponibles`}
          </div>

          {!isFull ? (
            <a className="button button-dark full-button" href={`#/booking/${activity.id}`}>
              Réserver ma place <ArrowRight size={16} />
            </a>
          ) : (
            <a className="button button-outline full-button" href={`#/booking/${activity.id}`}>
              Liste d'attente <ArrowRight size={16} />
            </a>
          )}

          {whatsappNumber && (
            <a
              className="booking-whatsapp"
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                `Bonjour, j'ai une question sur ${activity.title}.`,
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={15} />
              Une question ? WhatsApp
            </a>
          )}

          <p className="booking-reassurance">
            Retrouvez votre réservation depuis votre espace membre.
          </p>
        </aside>
      </div>
    </main>
  )
}
