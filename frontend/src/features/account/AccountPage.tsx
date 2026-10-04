import { useState, type SyntheticEvent } from 'react'
import type { Row, User } from '../../types'
import type { Payment } from '../../services/paymentService'
import { dateLabel, money, stateLabel } from '../../lib/presentation'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  User as UserIcon,
  X,
} from 'lucide-react'
import { getTicket, cancelBooking, chargerEspaceClient } from '../../services/accountService'
import { initiatePayment } from '../../services/paymentService'
import { saveProfile, changePassword } from '../../services/authService'
import { apiUrl } from '../../services/api'

interface AccountPageProps {
  user: User
  token: string
  bookings: Row[]
  orders: Row[]
  payments: Payment[]
  accountLoading: boolean
  ticketQr: string | null
  setTicketQr: (qr: string | null) => void
  paymentEnabled: boolean
  busy: boolean
  runForm: (
    event: SyntheticEvent<HTMLFormElement>,
    action: (data: FormData) => Promise<void>,
  ) => Promise<void>
  setUser: (user: User) => void
  setBookings: (bookings: Row[]) => void
  signOut: () => void
  setNotice: (notice: string) => void
  setError: (error: string) => void
}

export function AccountPage({
  user,
  token,
  bookings,
  orders,
  payments,
  accountLoading,
  ticketQr,
  setTicketQr,
  paymentEnabled,
  busy,
  runForm,
  setUser,
  setBookings,
  signOut,
  setNotice,
  setError,
}: AccountPageProps) {
  const [activeTab, setActiveTab] = useState<'bookings' | 'orders' | 'payments' | 'profile'>(
    'bookings',
  )

  const userInitials = (user.firstName?.[0] || '') + (user.lastName?.[0] || '') || 'N'

  return (
    <main className="page-content account-page-wrapper">
      {/* Profil Header Banner */}
      <div className="account-hero-card">
        <div className="account-avatar-wrapper">
          <div className="account-avatar-circle">{userInitials.toUpperCase()}</div>
          <span className="account-avatar-badge" title="Compte vérifié">
            <ShieldCheck size={14} />
          </span>
        </div>
        <div className="account-hero-info">
          <div className="account-hero-header">
            <span className="eyebrow">Espace Membre neneen</span>
            {user.role && user.role !== 'CUSTOMER' && (
              <span className="role-badge">{user.role}</span>
            )}
          </div>
          <h1>
            {user.firstName} {user.lastName}
          </h1>
          <div className="account-hero-meta">
            <span>
              <Mail size={14} /> {user.email}
            </span>
            <span>
              <Phone size={14} /> {user.phone}
            </span>
            <span>
              <MapPin size={14} /> Dakar, Sénégal
            </span>
          </div>
        </div>
        <button className="account-logout-btn" onClick={signOut}>
          <LogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </div>

      {/* Navigation Onglets */}
      <div className="account-tabs-bar">
        <button
          className={activeTab === 'bookings' ? 'account-tab-btn active' : 'account-tab-btn'}
          onClick={() => setActiveTab('bookings')}
        >
          <Calendar size={16} />
          <span>Réservations</span>
          <span className="tab-count-badge">{bookings.length}</span>
        </button>
        <button
          className={activeTab === 'orders' ? 'account-tab-btn active' : 'account-tab-btn'}
          onClick={() => setActiveTab('orders')}
        >
          <ShoppingBag size={16} />
          <span>Commandes</span>
          <span className="tab-count-badge">{orders.length}</span>
        </button>
        <button
          className={activeTab === 'payments' ? 'account-tab-btn active' : 'account-tab-btn'}
          onClick={() => setActiveTab('payments')}
        >
          <CreditCard size={16} />
          <span>Paiements</span>
          <span className="tab-count-badge">{payments.length}</span>
        </button>
        <button
          className={activeTab === 'profile' ? 'account-tab-btn active' : 'account-tab-btn'}
          onClick={() => setActiveTab('profile')}
        >
          <UserIcon size={16} />
          <span>Mon Profil &amp; Sécurité</span>
        </button>
      </div>

      {/* Chargement */}
      {accountLoading ? (
        <div className="loading-state" role="status">
          Chargement de votre espace personnel…
        </div>
      ) : (
        <div className="account-tab-content">
          {/* TAB 1 : MES RÉSERVATIONS */}
          {activeTab === 'bookings' && (
            <section className="account-card-section">
              <div className="section-header-row">
                <h2>Mes Sorties &amp; Événements</h2>
                <a className="button button-light btn-sm" href="#/activities">
                  Découvrir les sorties <ArrowRight size={14} />
                </a>
              </div>
              {bookings.length > 0 ? (
                <div className="account-items-grid">
                  {bookings.map((item) => {
                    const activity = (item.activity as Row) || {}
                    const statusStr = String(item.status)
                    return (
                      <article className="account-item-card" key={String(item.id)}>
                        <div className="item-card-header">
                          <span className="item-date">
                            <Calendar size={14} />
                            {dateLabel(String(activity.startsAt || item.createdAt))}
                          </span>
                          <span className={`status-pill status-${statusStr.toLowerCase()}`}>
                            {stateLabel(statusStr)}
                          </span>
                        </div>
                        <h3 className="item-card-title">
                          {String(activity.title || 'Activité neneen')}
                        </h3>
                        <div className="item-card-details">
                          <span>
                            <strong>Places :</strong> {String(item.quantity || 1)}
                          </span>
                          <span>
                            <strong>Total :</strong> {money(Number(item.total))}
                          </span>
                        </div>
                        <div className="item-card-actions">
                          {statusStr === 'CONFIRMED' && (
                            <button
                              className="btn-ticket"
                              onClick={() => {
                                void getTicket(token, String(item.id))
                                  .then((result) => setTicketQr(result.qr))
                                  .catch((reason) => setError((reason as Error).message))
                              }}
                            >
                              <QrCode size={16} /> Afficher le Billet QR
                            </button>
                          )}
                          {['PENDING', 'CONFIRMED'].includes(statusStr) && (
                            <button
                              className="btn-cancel"
                              onClick={() => {
                                void cancelBooking(token, String(item.id))
                                  .then(async () => {
                                    setNotice('Réservation annulée.')
                                    const data = await chargerEspaceClient(token)
                                    setBookings(data.bookings)
                                  })
                                  .catch((reason) => setError((reason as Error).message))
                              }}
                            >
                              Annuler
                            </button>
                          )}
                          {statusStr === 'PENDING' &&
                            String(item.paymentMethod) !== 'CASH' &&
                            paymentEnabled && (
                              <button
                                className="btn-pay"
                                onClick={() => {
                                  void initiatePayment(token, {
                                    bookingId: String(item.id),
                                    method: String(item.paymentMethod),
                                    idempotencyKey: crypto.randomUUID(),
                                  })
                                    .then((payment) => {
                                      if (payment.checkoutUrl) location.href = payment.checkoutUrl
                                    })
                                    .catch((reason) => setError((reason as Error).message))
                                }}
                              >
                                Payer en ligne <ArrowRight size={14} />
                              </button>
                            )}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-account-state">
                  <Calendar size={42} />
                  <h3>Aucune réservation enregistrée</h3>
                  <p>Vous n'avez pas encore réservé de sortie. Explorez notre programme !</p>
                  <a className="button button-dark" href="#/activities">
                    Voir les activités à venir
                  </a>
                </div>
              )}
            </section>
          )}

          {/* TAB 2 : MES COMMANDES */}
          {activeTab === 'orders' && (
            <section className="account-card-section">
              <div className="section-header-row">
                <h2>Mes Commandes Boutique</h2>
                <a className="button button-light btn-sm" href="#/shop">
                  Visiter la boutique <ArrowRight size={14} />
                </a>
              </div>
              {orders.length > 0 ? (
                <div className="account-items-grid">
                  {orders.map((item) => {
                    const statusStr = String(item.status)
                    const items = (item.items as Row[]) || []
                    return (
                      <article className="account-item-card" key={String(item.id)}>
                        <div className="item-card-header">
                          <span className="item-date">
                            <Clock size={14} /> Commande #{String(item.id).slice(-7)}
                          </span>
                          <span className={`status-pill status-${statusStr.toLowerCase()}`}>
                            {stateLabel(statusStr)}
                          </span>
                        </div>
                        <div className="order-items-list">
                          {items.map((line, idx) => (
                            <div className="order-item-row" key={idx}>
                              <PackageCheck size={14} />
                              <span>
                                {String(line.name)} (Taille {String(line.size)}) ×{' '}
                                {String(line.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="item-card-details">
                          <span>
                            <strong>Livraison :</strong> {String(item.shippingAddress || 'Retrait')}
                          </span>
                          <span>
                            <strong>Total :</strong> {money(Number(item.total))}
                          </span>
                        </div>
                        {statusStr === 'PENDING' &&
                          String(item.paymentMethod) !== 'CASH' &&
                          paymentEnabled && (
                            <div className="item-card-actions">
                              <button
                                className="btn-pay"
                                onClick={() => {
                                  void initiatePayment(token, {
                                    orderId: String(item.id),
                                    method: String(item.paymentMethod),
                                    idempotencyKey: crypto.randomUUID(),
                                  })
                                    .then((payment) => {
                                      if (payment.checkoutUrl) location.href = payment.checkoutUrl
                                    })
                                    .catch((reason) => setError((reason as Error).message))
                                }}
                              >
                                Régler la commande <ArrowRight size={14} />
                              </button>
                            </div>
                          )}
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-account-state">
                  <ShoppingBag size={42} />
                  <h3>Votre panier et vos commandes sont vides</h3>
                  <p>Découvrez nos articles exclusifs neneen dans notre boutique.</p>
                  <a className="button button-dark" href="#/shop">
                    Explorer le catalogue
                  </a>
                </div>
              )}
            </section>
          )}

          {/* TAB 3 : MES PAIEMENTS */}
          {activeTab === 'payments' && (
            <section className="account-card-section">
              <h2>Historique de vos Paiements</h2>
              {payments.length > 0 ? (
                <div className="payments-list-wrapper">
                  {payments.map((payment) => (
                    <article className="payment-row-card" key={payment.id}>
                      <div className="payment-main-info">
                        <span className="payment-icon">
                          <CreditCard size={18} />
                        </span>
                        <div>
                          <strong>{money(payment.amount)}</strong>
                          <small>Référence : #{payment.id.slice(-8)}</small>
                        </div>
                      </div>
                      <div className="payment-side-info">
                        <span className={`status-pill status-${payment.status.toLowerCase()}`}>
                          {stateLabel(payment.status)}
                        </span>
                        {payment.status === 'SUCCEEDED' && (
                          <button
                            className="btn-download-receipt"
                            onClick={(event) => {
                              event.preventDefault()
                              void fetch(apiUrl('/payments/') + payment.id + '/receipt.pdf', {
                                headers: { Authorization: `Bearer ${token}` },
                              })
                                .then((response) => response.blob())
                                .then((blob) => {
                                  const url = URL.createObjectURL(blob)
                                  const link = document.createElement('a')
                                  link.href = url
                                  link.download = 'recu-neneen.pdf'
                                  link.click()
                                  URL.revokeObjectURL(url)
                                })
                            }}
                          >
                            <Download size={14} /> Reçu PDF
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-account-state">
                  <CreditCard size={42} />
                  <h3>Aucun paiement effectué</h3>
                  <p>L'historique de vos reçus et transactions s'affichera ici.</p>
                </div>
              )}
            </section>
          )}

          {/* TAB 4 : PROFIL & SÉCURITÉ */}
          {activeTab === 'profile' && (
            <div className="account-settings-grid">
              <section className="profile-form-card">
                <div className="card-title-group">
                  <UserIcon size={20} />
                  <div>
                    <h2>Informations personnelles</h2>
                    <p>Mettez à jour votre nom et votre numéro WhatsApp.</p>
                  </div>
                </div>
                <form
                  onSubmit={(event) =>
                    runForm(event, async (data) => {
                      const result = await saveProfile(token, Object.fromEntries(data.entries()))
                      setUser(result.user)
                      localStorage.setItem('neneen_user', JSON.stringify(result.user))
                      setNotice('Profil enregistré avec succès.')
                    })
                  }
                >
                  <div className="field-pair">
                    <label className="form-label">
                      Prénom
                      <input name="firstName" defaultValue={user.firstName} required />
                    </label>
                    <label className="form-label">
                      Nom
                      <input name="lastName" defaultValue={user.lastName} required />
                    </label>
                  </div>
                  <label className="form-label">
                    Numéro WhatsApp / Téléphone
                    <input name="phone" defaultValue={user.phone} required />
                  </label>
                  <label className="form-label">
                    Adresse E-mail (Identifiant)
                    <input name="email" defaultValue={user.email} disabled />
                  </label>
                  <button className="button button-dark" disabled={busy}>
                    <CheckCircle2 size={16} /> Enregistrer mon profil
                  </button>
                </form>
              </section>

              <section className="profile-form-card">
                <div className="card-title-group">
                  <KeyRound size={20} />
                  <div>
                    <h2>Sécurité &amp; Mot de passe</h2>
                    <p>Modifiez votre mot de passe pour sécuriser votre compte.</p>
                  </div>
                </div>
                <form
                  onSubmit={(event) =>
                    runForm(event, async (data) => {
                      await changePassword(token, Object.fromEntries(data.entries()))
                      setNotice('Mot de passe modifié. Veuillez vous reconnecter.')
                      signOut()
                    })
                  }
                >
                  <label className="form-label">
                    Mot de passe actuel
                    <input name="currentPassword" type="password" required />
                  </label>
                  <label className="form-label">
                    Nouveau mot de passe
                    <input name="password" type="password" minLength={6} required />
                  </label>
                  <button className="button button-dark" disabled={busy}>
                    <KeyRound size={16} /> Changer mon mot de passe
                  </button>
                </form>
              </section>
            </div>
          )}
        </div>
      )}

      {/* Modal Billet QR Stylisé */}
      {ticketQr && (
        <div className="modal-backdrop" onClick={() => setTicketQr(null)}>
          <div
            className="ticket-modal-card"
            role="dialog"
            aria-label="Billet QR"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="ticket-modal-close" onClick={() => setTicketQr(null)}>
              <X size={20} />
            </button>
            <div className="ticket-modal-header">
              <span className="eyebrow">neneen · Pass Événement</span>
              <h3>Votre Billet d'Accès</h3>
              <p>Présentez ce code QR lors du contrôle à l'entrée.</p>
            </div>
            <div className="ticket-qr-container">
              <img src={ticketQr} alt="Code QR du billet" />
            </div>
            <div className="ticket-modal-footer">
              <button className="button button-dark full-button" onClick={() => window.print()}>
                Imprimer mon billet
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
