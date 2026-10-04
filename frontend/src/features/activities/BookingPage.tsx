import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import type { Activity, User } from '../../types'
import { dateLabel, money } from '../../lib/presentation'
import {
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  CreditCard,
  Banknote,
  AlertCircle,
  Clock,
  Smartphone,
  CheckCircle2,
  ShieldCheck,
  Ticket,
} from 'lucide-react'
import { reserverActivite } from '../../services/activityService'
import { initiatePayment } from '../../services/paymentService'
import { joinWaitlist } from '../../services/accountService'

interface BookingPageProps {
  bookingActivity: Activity
  user: User | null
  token: string | null
  paymentEnabled: boolean
  busy: boolean
  route: string
  runForm: (
    event: SyntheticEvent<HTMLFormElement>,
    action: (data: FormData) => Promise<void>,
  ) => Promise<void>
  setNotice: (notice: string) => void
  setError: (error: string) => void
}

export function BookingPage({
  bookingActivity,
  user,
  token,
  paymentEnabled,
  busy,
  route,
  runForm,
  setNotice,
  setError,
}: BookingPageProps) {
  const isFull = bookingActivity.capacity <= bookingActivity.reserved
  const spotsLeft = bookingActivity.capacity - bookingActivity.reserved
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1)
  const [selectedPayment, setSelectedPayment] = useState<string>(paymentEnabled ? 'WAVE' : 'CASH')

  const totalBookingPrice = bookingActivity.price * selectedQuantity

  return (
    <main className="page-content booking-page-container">
      <div className="booking-page-header">
        <a className="back-link" href={`#/activity/${bookingActivity.id}`}>
          ← Retour à l'activité
        </a>
        <div className="page-intro" style={{ textAlign: 'left', margin: '16px 0 32px' }}>
          <span className="eyebrow">Réservation d'expérience</span>
          <h1>
            Réserver votre place<span className="dot">.</span>
          </h1>
        </div>
      </div>

      <div className="booking-page-layout-grid">
        {/* Left Column: Form & Payment Selection */}
        <div className="booking-form-area">
          {isFull ? (
            <div className="booking-full-state">
              <div className="booking-full-banner">
                <AlertCircle size={24} />
                <div>
                  <strong>Cette sortie est actuellement complète</strong>
                  <p>
                    Inscrivez-vous sur la liste d'attente pour être prévenu en priorité si une place
                    se libère.
                  </p>
                </div>
              </div>
              <button
                className="button button-dark full-button"
                onClick={() => {
                  if (!token) {
                    sessionStorage.setItem('neneen_after_login', route)
                    location.hash = '/login'
                    return
                  }
                  void joinWaitlist(token, bookingActivity.id)
                    .then(() => setNotice("Vous êtes inscrit sur la liste d'attente."))
                    .catch((error) => setError((error as Error).message))
                }}
              >
                Rejoindre la liste d'attente <ArrowRight size={16} />
              </button>
            </div>
          ) : user && token ? (
            <form
              className="checkout-form"
              noValidate
              onSubmit={(event) =>
                runForm(event, async () => {
                  if (!token) throw new Error('Reconnectez-vous pour réserver cette activité.')
                  const result = await reserverActivite(
                    {
                      activityId: bookingActivity.id,
                      quantity: selectedQuantity,
                      paymentMethod: selectedPayment,
                    },
                    token,
                  )
                  if (selectedPayment !== 'CASH') {
                    try {
                      const payment = await initiatePayment(token, {
                        bookingId: (result.booking as { id: string }).id,
                        method: selectedPayment,
                        idempotencyKey: crypto.randomUUID(),
                      })
                      if (payment.checkoutUrl) {
                        location.href = payment.checkoutUrl
                        return
                      }
                    } catch (err) {
                      console.warn('Initiate payment gateway exception:', err)
                    }
                  }
                  setNotice(
                    `${result.message} Référence : ${(result.booking as { id: string }).id}`,
                  )
                  location.hash = '/account'
                })
              }
            >
              {/* Step 1: Participants */}
              <div className="checkout-section">
                <h3 className="checkout-section-title">
                  <Ticket size={18} /> 1. Sélection des places
                </h3>
                <label className="form-label">
                  <span>Nombre de participants</span>
                  <select
                    name="quantity"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                  >
                    {Array.from({ length: Math.min(spotsLeft, 10) }, (_, index) => (
                      <option value={index + 1} key={index}>
                        {index + 1} participant{index > 0 ? 's' : ''} —{' '}
                        {money(bookingActivity.price * (index + 1))}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Step 2: Mode de Règlement */}
              <div className="checkout-section">
                <h3 className="checkout-section-title">
                  <CreditCard size={18} /> 2. Mode de règlement
                </h3>
                <div className="payment-methods-grid">
                  {paymentEnabled && (
                    <label
                      className={`payment-method-card wave-card ${selectedPayment === 'WAVE' ? 'active' : ''}`}
                      onClick={() => setSelectedPayment('WAVE')}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="WAVE"
                        checked={selectedPayment === 'WAVE'}
                        onChange={() => setSelectedPayment('WAVE')}
                      />
                      <div className="payment-card-badge wave-badge">Wave</div>
                      <div className="payment-card-content">
                        <Smartphone size={20} className="payment-card-icon" />
                        <div>
                          <strong>Wave Digital</strong>
                          <span>Paiement mobile instantané via QR Code</span>
                        </div>
                      </div>
                      {selectedPayment === 'WAVE' && (
                        <CheckCircle2 size={18} className="payment-checked-icon" />
                      )}
                    </label>
                  )}

                  {paymentEnabled && (
                    <label
                      className={`payment-method-card om-card ${selectedPayment === 'ORANGE_MONEY' ? 'active' : ''}`}
                      onClick={() => setSelectedPayment('ORANGE_MONEY')}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="ORANGE_MONEY"
                        checked={selectedPayment === 'ORANGE_MONEY'}
                        onChange={() => setSelectedPayment('ORANGE_MONEY')}
                      />
                      <div className="payment-card-badge om-badge">Orange Money</div>
                      <div className="payment-card-content">
                        <Smartphone size={20} className="payment-card-icon" />
                        <div>
                          <strong>Orange Money</strong>
                          <span>Paiement mobile Orange Sénégal</span>
                        </div>
                      </div>
                      {selectedPayment === 'ORANGE_MONEY' && (
                        <CheckCircle2 size={18} className="payment-checked-icon" />
                      )}
                    </label>
                  )}

                  {paymentEnabled && (
                    <label
                      className={`payment-method-card card-card ${selectedPayment === 'CARD' ? 'active' : ''}`}
                      onClick={() => setSelectedPayment('CARD')}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="CARD"
                        checked={selectedPayment === 'CARD'}
                        onChange={() => setSelectedPayment('CARD')}
                      />
                      <div className="payment-card-badge card-badge">Carte bancaire</div>
                      <div className="payment-card-content">
                        <CreditCard size={20} className="payment-card-icon" />
                        <div>
                          <strong>Carte Visa / MasterCard</strong>
                          <span>Paiement sécurisé par carte</span>
                        </div>
                      </div>
                      {selectedPayment === 'CARD' && (
                        <CheckCircle2 size={18} className="payment-checked-icon" />
                      )}
                    </label>
                  )}

                  <label
                    className={`payment-method-card cash-card ${selectedPayment === 'CASH' ? 'active' : ''}`}
                    onClick={() => setSelectedPayment('CASH')}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="CASH"
                      checked={selectedPayment === 'CASH'}
                      onChange={() => setSelectedPayment('CASH')}
                    />
                    <div className="payment-card-badge cash-badge">Espèces</div>
                    <div className="payment-card-content">
                      <Banknote size={20} className="payment-card-icon" />
                      <div>
                        <strong>Paiement sur place</strong>
                        <span>Règlement le jour de la sortie</span>
                      </div>
                    </div>
                    {selectedPayment === 'CASH' && (
                      <CheckCircle2 size={18} className="payment-checked-icon" />
                    )}
                  </label>
                </div>

                <div className="payment-note-box" style={{ marginTop: '16px' }}>
                  <Clock size={16} />
                  <span>Les places vous sont réservées pendant la procédure de confirmation.</span>
                </div>
              </div>

              <button className="button button-dark full-button submit-order-btn" disabled={busy}>
                {busy
                  ? 'Validation en cours…'
                  : `Confirmer la réservation (${money(totalBookingPrice)})`}{' '}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <div className="booking-login-prompt">
              <ShieldCheck size={36} strokeWidth={1.5} />
              <h3>Connexion requise</h3>
              <p>
                Connectez-vous à votre espace membre pour réserver votre place à cette expérience.
              </p>
              <a
                className="button button-dark full-button"
                href="#/login"
                onClick={() => sessionStorage.setItem('neneen_after_login', route)}
              >
                Se connecter pour réserver <ArrowRight size={16} />
              </a>
            </div>
          )}
        </div>

        {/* Right Column: Activity Summary Card */}
        <aside className="booking-summary-card">
          <div
            className="booking-card-media"
            style={
              bookingActivity.imageUrl
                ? { backgroundImage: `url(${bookingActivity.imageUrl})` }
                : undefined
            }
          >
            <span className="booking-media-badge">Sortie neneen</span>
          </div>

          <div className="booking-card-body">
            <span className="eyebrow">Détails de l'événement</span>
            <h2 className="booking-summary-title">{bookingActivity.title}</h2>

            <div className="booking-summary-meta">
              <div className="meta-item">
                <Calendar size={16} className="meta-icon" />
                <div>
                  <span className="meta-label">Date & Heure</span>
                  <strong>{dateLabel(bookingActivity.startsAt)}</strong>
                </div>
              </div>

              <div className="meta-item">
                <MapPin size={16} className="meta-icon" />
                <div>
                  <span className="meta-label">Lieu</span>
                  <strong>{bookingActivity.location}</strong>
                </div>
              </div>

              <div className="meta-item">
                <Users size={16} className="meta-icon" />
                <div>
                  <span className="meta-label">Places disponibles</span>
                  <strong>
                    {isFull
                      ? 'Complet'
                      : `${spotsLeft} place${spotsLeft > 1 ? 's' : ''} restante${spotsLeft > 1 ? 's' : ''}`}
                  </strong>
                </div>
              </div>
            </div>

            <div className="cart-total-divider" />

            <div className="booking-price-breakdown">
              <div className="price-row">
                <span>Prix unitaire</span>
                <strong>{money(bookingActivity.price)}</strong>
              </div>
              {selectedQuantity > 1 && (
                <div className="price-row">
                  <span>Nombre de places</span>
                  <strong>× {selectedQuantity}</strong>
                </div>
              )}
              <div className="cart-total-divider" />
              <div className="price-row grand-total-row">
                <span>Total à régler</span>
                <strong className="total-amount">{money(totalBookingPrice)}</strong>
              </div>
            </div>

            <div className="checkout-trust-box" style={{ marginTop: '16px' }}>
              <div>
                <ShieldCheck size={14} /> <span>Confirmation immédiate par SMS / E-mail</span>
              </div>
              <div>
                <Clock size={14} /> <span>Places réservées en temps réel</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
