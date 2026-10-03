import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatMoney } from '@neneen/contracts'
import { AccountForms } from './components/AccountForms'
import { initiatePayment, listPayments, type Payment } from './services/paymentService'
import { mergeCart, saveCart } from './services/cartService'
import {
  forgotPassword,
  resetPassword,
  verifyEmail,
  saveProfile,
  changePassword,
  deleteAccount,
  logout,
  resendVerification,
} from './services/authService'
import { cancelBooking, joinWaitlist, getTicket } from './services/accountService'
import { getContent, subscribeNewsletter } from './services/contentService'
import { uploadImage } from './services/uploadService'
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  Check,
  CircleUserRound,
  MapPin,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  X,
} from 'lucide-react'
import type { SyntheticEvent } from 'react'
import {
  annulerActivite,
  chargerVueAdmin,
  enregistrerActivite,
  enregistrerProduit,
  masquerProduit,
  modifierEtatCommande,
  modifierEtatMessage,
  modifierEtatReservation,
  setVariantStock,
  listContents,
  saveContent,
  checkIn,
  participantsCsv,
  changeUserRole,
  confirmCash,
  confirmRefund,
} from './services/adminService'
import { listerActivites, reserverActivite } from './services/activityService'
import { chargerEspaceClient } from './services/accountService'
import { envoyerMessage } from './services/contactService'
import { listerProduits, passerCommande } from './services/shopService'
import type { Activity, CartLine, Product, Row, User } from './types'
import './App.css'
import './site.css'

const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')
const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || ''
const photos: Record<string, string> = {
  EXCURSION:
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85',
  AFTERWORK:
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=85',
  EVENT:
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=85',
}
const money = formatMoney
const stockForSize = (product: Product, size: string) =>
  product.variants?.find((variant) => variant.size === size)?.stock ?? product.stock
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Dakar',
  }).format(new Date(value))
const typeLabel = (type: string) =>
  ({ EXCURSION: 'Excursion', AFTERWORK: 'Afterwork', EVENT: 'Événement' })[type] || type
const stateLabel = (value: unknown) =>
  ({
    PENDING: 'En attente',
    PAID: 'Payée',
    SUCCEEDED: 'Payé',
    FAILED: 'Échec',
    REFUND_PENDING: 'Remboursement en cours',
    REFUNDED: 'Remboursé',
    CONFIRMED: 'Confirmée',
    PROCESSING: 'En préparation',
    SHIPPED: 'Expédiée',
    COMPLETED: 'Terminée',
    CANCELLED: 'Annulée',
    NEW: 'Nouveau',
    READ: 'Lu',
    REPLIED: 'Répondu',
    PUBLISHED: 'Publié',
    DRAFT: 'Brouillon',
  })[String(value)] || String(value)

function App() {
  const [route, setRoute] = useState(location.hash.slice(1) || '/')
  const [token, setToken] = useState(localStorage.getItem('neneen_token'))
  const [user, setUser] = useState<User | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('neneen_user') || 'null') as User | null
    } catch {
      return null
    }
  })
  const [accountLoadedToken, setAccountLoadedToken] = useState<string | null>(null)
  const [cartSynced, setCartSynced] = useState(false)
  const cartHydrationStarted = useRef(false)
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('neneen_cart') || '[]') as CartLine[]
    } catch {
      return []
    }
  })
  const [bookings, setBookings] = useState<Row[]>([])
  const [orders, setOrders] = useState<Row[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [ticketQr, setTicketQr] = useState<string | null>(null)
  const [paymentEnabled, setPaymentEnabled] = useState(false)
  const [managedContent, setManagedContent] = useState<{ title: string; body: string } | null>(null)
  const [adminData, setAdminData] = useState<Row>({})
  const [contents, setContents] = useState<
    { slug: string; title: string; body: string; published: boolean }[]
  >([])
  const [adminTab, setAdminTab] = useState('dashboard')
  const [activityFilter, setActivityFilter] = useState('ALL')
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedSize, setSelectedSize] = useState('M')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const accountLoading = route === '/account' && Boolean(token) && accountLoadedToken !== token

  useEffect(() => {
    const updateRoute = () => {
      setRoute(location.hash.slice(1) || '/')
      setMenuOpen(false)
      setNotice('')
      setError('')
    }
    addEventListener('hashchange', updateRoute)
    return () => removeEventListener('hashchange', updateRoute)
  }, [])
  useEffect(() => {
    window.scrollTo(0, 0)
    const title = route === '/' ? 'Accueil' : route.split('/')[1]?.replace(/-/g, ' ') || 'neneen'
    document.title = `${title} | neneen · Dakar`
  }, [route])
  const catalog = useQuery({
    queryKey: ['catalog'],
    queryFn: () => Promise.all([listerActivites(), listerProduits()]),
  })
  const activities: Activity[] = catalog.data?.[0] ?? []
  const products: Product[] = catalog.data?.[1] ?? []
  const catalogLoading = catalog.isPending
  useEffect(() => {
    const updateSession = () => {
      setToken(localStorage.getItem('neneen_token'))
      try {
        setUser(JSON.parse(localStorage.getItem('neneen_user') || 'null') as User | null)
      } catch {
        setUser(null)
      }
    }
    addEventListener('neneen-session', updateSession)
    return () => removeEventListener('neneen-session', updateSession)
  }, [])
  useEffect(() => {
    localStorage.setItem('neneen_cart', JSON.stringify(cart))
    if (!token || !cartSynced) return
    const timer = setTimeout(() => {
      void saveCart(token, cart).catch(() => undefined)
    }, 500)
    return () => clearTimeout(timer)
  }, [cart, token, cartSynced])
  useEffect(() => {
    if (!token || !catalog.data || cartSynced || cartHydrationStarted.current) return
    cartHydrationStarted.current = true
    void mergeCart(token, cart)
      .then(({ cart: stored }) => {
        setCart(
          stored.items.flatMap((line) => {
            const product = catalog.data[1].find((item) => item.id === line.productId)
            return product
              ? [
                  {
                    productId: line.productId,
                    size: line.size,
                    quantity: line.quantity,
                    name: product.name,
                    color: product.color,
                    price: product.price,
                  },
                ]
              : []
          }),
        )
        setCartSynced(true)
      })
      .catch((reason) => {
        cartHydrationStarted.current = false
        setError((reason as Error).message)
      })
  }, [token, catalog.data, cartSynced, cart])
  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL || 'http://localhost:4000/api') + '/payments/config')
      .then((response) => response.json())
      .then((result: { enabled: boolean }) => setPaymentEnabled(result.enabled))
      .catch(() => undefined)
  }, [])
  useEffect(() => {
    if (['faq', 'cgv', 'mentions', 'about'].includes(route.slice(1)))
      void getContent(route.slice(1))
        .then((result) => setManagedContent(result.content))
        .catch(() => setManagedContent(null))
  }, [route])
  useEffect(() => {
    if (route === '/account' && token) {
      void chargerEspaceClient(token)
        .then(({ bookings: customerBookings, orders: customerOrders }) => {
          setBookings(customerBookings)
          setOrders(customerOrders)
          void listPayments(token)
            .then(setPayments)
            .catch(() => setPayments([]))
        })
        .catch((reason: Error) => setError(reason.message))
        .finally(() => setAccountLoadedToken(token))
    }
    if (route === '/admin' && token && adminTab === 'content')
      void listContents(token)
        .then((result) => setContents(result.contents))
        .catch((reason) => setError((reason as Error).message))
    if (route === '/admin' && token && ['ADMIN', 'STAFF'].includes(user?.role || ''))
      void chargerVueAdmin(token, adminTab)
        .then(setAdminData)
        .catch((reason: Error) => setError(reason.message))
  }, [route, token, user, adminTab])

  async function refreshAdmin() {
    if (!token) return
    try {
      setAdminData(await chargerVueAdmin(token, adminTab))
    } catch (reason) {
      setError((reason as Error).message)
    }
  }

  async function runForm(
    event: SyntheticEvent<HTMLFormElement>,
    action: (data: FormData) => Promise<void>,
  ) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action(new FormData(event.currentTarget))
    } catch (reason) {
      setError((reason as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function signIn(result: { user: User; token: string }) {
    localStorage.setItem('neneen_token', result.token)
    localStorage.setItem('neneen_user', JSON.stringify(result.user))
    setToken(result.token)
    setUser(result.user)
    const nextRoute = sessionStorage.getItem('neneen_after_login') || '/account'
    sessionStorage.removeItem('neneen_after_login')
    cartHydrationStarted.current = false
    setCartSynced(false)
    location.hash = nextRoute
  }

  function signOut() {
    void logout().catch(() => undefined)
    localStorage.removeItem('neneen_token')
    localStorage.removeItem('neneen_user')
    setToken(null)
    setUser(null)
    cartHydrationStarted.current = false
    setCartSynced(false)
    setCart([])
    location.hash = '/'
  }

  function changeCart(product: Product, size: string, delta: number) {
    setCart((current) => {
      const line = current.find((item) => item.productId === product.id && item.size === size)
      if (line)
        return current
          .map((item) =>
            item === line
              ? {
                  ...item,
                  quantity: Math.min(
                    stockForSize(product, size),
                    Math.max(0, item.quantity + delta),
                  ),
                }
              : item,
          )
          .filter((item) => item.quantity > 0)
      return delta > 0 && stockForSize(product, size) > 0
        ? [
            ...current,
            {
              productId: product.id,
              name: product.name,
              color: product.color,
              price: product.price,
              size,
              quantity: 1,
            },
          ]
        : current
    })
  }

  async function adminStatus(action: (sessionToken: string) => Promise<unknown>) {
    if (!token) {
      setError('Votre session a expiré. Reconnectez-vous pour continuer.')
      return
    }
    try {
      await action(token)
      await refreshAdmin()
      setNotice('Mise à jour enregistrée.')
    } catch (reason) {
      setError((reason as Error).message)
    }
  }

  const parts = route.split('/').filter(Boolean)
  const bookingActivity =
    parts[0] === 'booking' ? activities.find((item) => item.id === parts[1]) : undefined
  const detailActivity =
    parts[0] === 'activity' ? activities.find((item) => item.id === parts[1]) : undefined
  const detailProduct =
    parts[0] === 'product' ? products.find((item) => item.id === parts[1]) : undefined
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)

  function activityCard(activity: Activity, index: number) {
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

  function productCard(product: Product) {
    return (
      <article className="product-card" key={product.id}>
        <button
          className={`product-image tone-${product.color.toLowerCase().replace(/[^a-z]/g, '')}`}
          onClick={() => {
            setSelectedProduct(product)
            setSelectedSize(product.sizes[0] || 'M')
          }}
          style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}
          aria-label={`Choisir ${product.name} ${product.color}`}
        >
          <span className="product-mark">n.</span>
          <span className="product-add">
            <Plus size={18} />
          </span>
        </button>
        <div className="product-info">
          <div>
            <span className="eyebrow">Build Different</span>
            <h3>{product.name}</h3>
            <span className="muted">
              {product.color} · {product.stock} disponibles
            </span>
            <a className="text-action product-details-link" href={`#/product/${product.id}`}>
              Voir la fiche <ArrowRight size={14} />
            </a>
          </div>
          <strong>{money(product.price)}</strong>
        </div>
      </article>
    )
  }

  function adminView() {
    const tabs = [
      'dashboard',
      'activities',
      'bookings',
      'orders',
      'payments',
      'products',
      'customers',
      'messages',
      'content',
      'check-in',
    ]
    const labels: Record<string, string> = {
      dashboard: 'Vue d’ensemble',
      activities: 'Activités',
      bookings: 'Réservations',
      orders: 'Commandes',
      payments: 'Paiements',
      products: 'Produits',
      customers: 'Clients',
      messages: 'Messages',
      content: 'Contenus',
      'check-in': 'Check-in',
    }
    const stats: Array<[string, string | number | undefined]> = [
      ['Membres', adminData.customers as number | undefined],
      ['Activités', adminData.activities as number | undefined],
      ['Réservations', adminData.bookings as number | undefined],
      ['Commandes', adminData.orders as number | undefined],
      ['Messages à lire', adminData.unreadMessages as number | undefined],
      ['Ventes confirmées', money(Number(adminData.revenue || 0))],
    ]
    const activitiesData = (adminData.activities as Activity[]) || []
    const productsData = (adminData.products as Product[]) || []
    const rows = (key: string) => (adminData[key] as Row[]) || []
    return (
      <main className="admin-page">
        <div className="admin-title">
          <div>
            <span className="eyebrow">neneen · Gestion</span>
            <h1>
              Administration<span className="dot">.</span>
            </h1>
          </div>
          <a className="button button-light" href="#/">
            Voir le site <ArrowRight size={15} />
          </a>
        </div>
        {user && ['ADMIN', 'STAFF'].includes(user.role) && token ? (
          <div className="admin-layout">
            <aside className="admin-sidebar">
              {tabs.map((tab) => (
                <button
                  className={adminTab === tab ? 'admin-tab active' : 'admin-tab'}
                  key={tab}
                  onClick={() => setAdminTab(tab)}
                >
                  {labels[tab]}
                  <ArrowRight size={14} />
                </button>
              ))}
              <div className="admin-user">
                <CircleUserRound size={16} />
                {user.firstName} {user.lastName}
                <button onClick={signOut} aria-label="Déconnexion">
                  <X size={14} />
                </button>
              </div>
            </aside>
            <section className="admin-main">
              <div className="admin-section-title">
                <div>
                  <span className="eyebrow">Espace de travail</span>
                  <h2>{labels[adminTab]}</h2>
                </div>
                <button className="icon-button" onClick={() => void refreshAdmin()}>
                  Actualiser <ArrowRight size={14} />
                </button>
              </div>
              {adminTab === 'dashboard' && (
                <div className="stat-grid">
                  {stats.map(([label, value]) => (
                    <article className="stat" key={label}>
                      <span>{label}</span>
                      <strong>{value ?? '—'}</strong>
                    </article>
                  ))}
                  <div className="admin-callout">
                    <span className="eyebrow light">Communauté neneen</span>
                    <h3>Gardez votre communauté en mouvement.</h3>
                    <button
                      className="button button-light"
                      onClick={() => setAdminTab('activities')}
                    >
                      Créer une activité <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}
              {adminTab === 'activities' && (
                <div className="admin-columns">
                  <div className="admin-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Activité</th>
                          <th>Date</th>
                          <th>Places</th>
                          <th>État</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activitiesData.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.title}</strong>
                              <small>
                                {typeLabel(item.type)} · {money(item.price)}
                              </small>
                            </td>
                            <td>{dateLabel(item.startsAt)}</td>
                            <td>
                              {item.reserved}/{item.capacity}
                            </td>
                            <td>{stateLabel(item.status)}</td>
                            <td>
                              <button
                                className="icon-button"
                                onClick={() => {
                                  if (token)
                                    void participantsCsv(token, item.id).catch((reason) =>
                                      setError((reason as Error).message),
                                    )
                                }}
                              >
                                CSV
                              </button>
                              <button className="icon-button" onClick={() => setEditActivity(item)}>
                                Modifier
                              </button>
                              <button
                                className="icon-button danger"
                                onClick={() =>
                                  void adminStatus((sessionToken) =>
                                    annulerActivite(sessionToken, item.id),
                                  )
                                }
                              >
                                Annuler
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <form
                    className="admin-form"
                    noValidate
                    key={editActivity?.id || 'new-activity'}
                    onSubmit={(event) =>
                      runForm(event, async (data) => {
                        const values = Object.fromEntries(data.entries())
                        const payload = {
                          ...values,
                          imageUrl: String(values.imageUrl || ''),
                          featured: values.featured === 'on',
                          gallery: [],
                          startsAt: values.startsAt
                            ? new Date(`${String(values.startsAt)}:00Z`).toISOString()
                            : '',
                          price: Number(values.price),
                          capacity: Number(values.capacity),
                          schedule: String(values.schedule || '')
                            .split(/\r?\n/)
                            .map((step) => step.trim())
                            .filter(Boolean),
                          included: String(values.included || '')
                            .split(/\r?\n/)
                            .map((item) => item.trim())
                            .filter(Boolean),
                        }
                        if (!token) throw new Error('Reconnectez-vous pour gérer les activités.')
                        const file = data.get('imageFile')
                        if (file instanceof File && file.size > 0)
                          payload.imageUrl = await uploadImage(token, 'activities', file)
                        await enregistrerActivite(token, payload, editActivity?.id)
                        setEditActivity(null)
                        await refreshAdmin()
                        setNotice('Activité enregistrée.')
                      })
                    }
                  >
                    <span className="eyebrow">
                      {editActivity ? 'Modifier' : 'Nouvelle activité'}
                    </span>
                    <h3>{editActivity?.title || 'Créer une sortie'}</h3>
                    <label>
                      Nom
                      <input name="title" required defaultValue={editActivity?.title} />
                    </label>
                    <label>
                      Type
                      <select name="type" defaultValue={editActivity?.type || 'EXCURSION'}>
                        <option value="EXCURSION">Excursion</option>
                        <option value="AFTERWORK">Afterwork</option>
                        <option value="EVENT">Événement</option>
                      </select>
                    </label>
                    <label>
                      Description
                      <textarea
                        name="description"
                        required
                        defaultValue={editActivity?.description}
                      />
                    </label>
                    <label>
                      Lieu
                      <input name="location" required defaultValue={editActivity?.location} />
                    </label>
                    <label>
                      Durée estimée
                      <input
                        name="duration"
                        maxLength={100}
                        defaultValue={editActivity?.duration || ''}
                        placeholder="Ex. 2 jours, 1 nuit"
                      />
                    </label>
                    <label>
                      Date
                      <input
                        type="datetime-local"
                        name="startsAt"
                        required
                        defaultValue={
                          editActivity
                            ? new Date(editActivity.startsAt).toISOString().slice(0, 16)
                            : ''
                        }
                      />
                    </label>
                    <div className="field-pair">
                      <label>
                        Prix
                        <input
                          name="price"
                          type="number"
                          min="0"
                          required
                          defaultValue={editActivity?.price}
                        />
                      </label>
                      <label>
                        Places
                        <input
                          name="capacity"
                          type="number"
                          min="1"
                          required
                          defaultValue={editActivity?.capacity}
                        />
                      </label>
                    </div>
                    <label>
                      Programme (une étape par ligne)
                      <textarea
                        name="schedule"
                        maxLength={5000}
                        defaultValue={editActivity?.schedule?.join('\n') || ''}
                        placeholder={'8 h : départ de Dakar\n10 h : arrivée'}
                      />
                    </label>
                    <label>
                      Inclus dans le prix (un élément par ligne)
                      <textarea
                        name="included"
                        maxLength={3000}
                        defaultValue={editActivity?.included?.join('\n') || ''}
                        placeholder={'Transport aller-retour\nDéjeuner'}
                      />
                    </label>
                    <label>
                      À prévoir
                      <textarea
                        name="bringList"
                        maxLength={1000}
                        defaultValue={editActivity?.bringList || ''}
                      />
                    </label>
                    <label>
                      Photo (URL)
                      <input name="imageUrl" type="url" defaultValue={editActivity?.imageUrl} />
                    </label>
                    <label>
                      Ou importer une image
                      <input name="imageFile" type="file" accept="image/*" />
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        name="featured"
                        defaultChecked={editActivity?.featured}
                      />{' '}
                      Mettre en avant sur l’accueil
                    </label>
                    <label>
                      Publication
                      <select name="status" defaultValue={editActivity?.status || 'DRAFT'}>
                        <option value="DRAFT">Brouillon</option>
                        <option value="PUBLISHED">Publié</option>
                        <option value="CANCELLED">Annulé</option>
                      </select>
                    </label>
                    <button className="button button-dark" disabled={busy}>
                      {editActivity ? 'Enregistrer' : 'Créer l’activité'}
                    </button>
                  </form>
                </div>
              )}
              {adminTab === 'products' && (
                <div className="admin-columns">
                  <div className="admin-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Produit</th>
                          <th>Prix</th>
                          <th>Stock</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {productsData.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.name}</strong>
                              <small>{item.color}</small>
                            </td>
                            <td>{money(item.price)}</td>
                            <td>{item.stock}</td>
                            <td>
                              <button className="icon-button" onClick={() => setEditProduct(item)}>
                                Modifier
                              </button>
                              <button
                                className="icon-button danger"
                                onClick={() =>
                                  void adminStatus((sessionToken) =>
                                    masquerProduit(sessionToken, item.id),
                                  )
                                }
                              >
                                Masquer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <form
                    className="admin-form"
                    noValidate
                    key={editProduct?.id || 'new-product'}
                    onSubmit={(event) =>
                      runForm(event, async (data) => {
                        const values = Object.fromEntries(data.entries())
                        const payload = {
                          ...values,
                          imageUrl: String(values.imageUrl || ''),
                          price: Number(values.price),
                          stock: Number(values.stock),
                          sizes: String(values.sizes || '')
                            .split(',')
                            .map((size) => size.trim())
                            .filter(Boolean),
                          active: true,
                        }
                        if (!token) throw new Error('Reconnectez-vous pour gérer le catalogue.')
                        const file = data.get('imageFile')
                        if (file instanceof File && file.size > 0)
                          payload.imageUrl = await uploadImage(token, 'products', file)
                        await enregistrerProduit(token, payload, editProduct?.id)
                        setEditProduct(null)
                        await refreshAdmin()
                        setNotice('Produit enregistré.')
                      })
                    }
                  >
                    <span className="eyebrow">Catalogue</span>
                    <h3>{editProduct?.name || 'Ajouter un produit'}</h3>
                    <label>
                      Nom
                      <input name="name" required defaultValue={editProduct?.name} />
                    </label>
                    <label>
                      Description
                      <textarea
                        name="description"
                        required
                        defaultValue={editProduct?.description}
                      />
                    </label>
                    <label>
                      Couleur
                      <input name="color" required defaultValue={editProduct?.color} />
                    </label>
                    <div className="field-pair">
                      <label>
                        Prix
                        <input
                          name="price"
                          type="number"
                          min="1"
                          required
                          defaultValue={editProduct?.price}
                        />
                      </label>
                      <label>
                        Stock initial {editProduct && '(modifier par taille ci-dessous)'}
                        <input
                          name="stock"
                          type="number"
                          min="0"
                          required
                          disabled={Boolean(editProduct)}
                          defaultValue={editProduct?.stock}
                        />
                      </label>
                    </div>
                    <label>
                      Tailles séparées par des virgules
                      <input
                        name="sizes"
                        disabled={Boolean(editProduct)}
                        defaultValue={editProduct?.sizes.join(', ') || 'S, M, L, XL'}
                      />
                    </label>
                    <label>
                      Photo (URL)
                      <input name="imageUrl" type="url" defaultValue={editProduct?.imageUrl} />
                    </label>
                    <label>
                      Ou importer une image
                      <input name="imageFile" type="file" accept="image/*" />
                    </label>

                    <button className="button button-dark" disabled={busy}>
                      {editProduct ? 'Enregistrer' : 'Ajouter le produit'}
                    </button>
                  </form>
                  {editProduct && (
                    <div>
                      <h4>Stock par taille</h4>
                      {(editProduct.variants || []).map((variant) => (
                        <form
                          key={variant.size}
                          onSubmit={(event) =>
                            runForm(event, async (data) => {
                              if (!token) return
                              await setVariantStock(token, editProduct.id, {
                                size: variant.size,
                                color: editProduct.color,
                                stock: Number(data.get('stock')),
                              })
                              await refreshAdmin()
                              setNotice('Stock mis à jour.')
                            })
                          }
                        >
                          <label>
                            {variant.size}
                            <input
                              type="number"
                              name="stock"
                              min="0"
                              defaultValue={variant.stock}
                            />
                          </label>
                          <button type="submit">Enregistrer</button>
                        </form>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {adminTab === 'bookings' && (
                <div className="admin-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Sortie</th>
                        <th>Places</th>
                        <th>Total</th>
                        <th>État</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows('bookings').map((item) => (
                        <tr key={String(item.id)}>
                          <td>
                            {String((item.user as Row)?.firstName)}{' '}
                            {String((item.user as Row)?.lastName)}
                            <small>{String((item.user as Row)?.email)}</small>
                          </td>
                          <td>{String((item.activity as Row)?.title)}</td>
                          <td>{String(item.quantity)}</td>
                          <td>{money(Number(item.total))}</td>
                          <td>
                            <select
                              value={String(item.status)}
                              onChange={(event) =>
                                void adminStatus((sessionToken) =>
                                  modifierEtatReservation(sessionToken, String(item.id), {
                                    status: event.target.value,
                                  }),
                                )
                              }
                            >
                              <option value="PENDING">En attente</option>
                              <option value="CONFIRMED">Confirmée</option>
                              <option value="CANCELLED">Annulée</option>
                            </select>
                            {String(item.paymentMethod) === 'CASH' &&
                              ((item.payments as Row[]) || []).some(
                                (payment) => payment.status === 'PENDING',
                              ) && (
                                <button
                                  className="text-action"
                                  onClick={() => {
                                    const payment = ((item.payments as Row[]) || []).find(
                                      (value) => value.status === 'PENDING',
                                    )
                                    if (payment)
                                      void adminStatus((sessionToken) =>
                                        confirmCash(sessionToken, String(payment.id)),
                                      )
                                  }}
                                >
                                  Espèces reçues
                                </button>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {adminTab === 'orders' && (
                <div className="admin-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Commande</th>
                        <th>Adresse</th>
                        <th>Total</th>
                        <th>État</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows('orders').map((item) => (
                        <tr key={String(item.id)}>
                          <td>
                            {String((item.user as Row)?.firstName)}{' '}
                            {String((item.user as Row)?.lastName)}
                            <small>{String((item.user as Row)?.phone)}</small>
                          </td>
                          <td>
                            {((item.items as Row[]) || [])
                              .map(
                                (line) =>
                                  `${String(line.name)} · ${String(line.size)} × ${String(line.quantity)}`,
                              )
                              .join(', ')}
                          </td>
                          <td>{String(item.shippingAddress)}</td>
                          <td>{money(Number(item.total))}</td>
                          <td>
                            <select
                              value={String(item.status)}
                              onChange={(event) =>
                                void adminStatus((sessionToken) =>
                                  modifierEtatCommande(sessionToken, String(item.id), {
                                    status: event.target.value,
                                  }),
                                )
                              }
                            >
                              <option value="PENDING">En attente</option>
                              <option value="PAID">Payée</option>
                              <option value="PROCESSING">En préparation</option>
                              <option value="SHIPPED">Expédiée</option>
                              <option value="COMPLETED">Terminée</option>
                              <option value="CANCELLED">Annulée</option>
                            </select>
                            {String(item.paymentMethod) === 'CASH' &&
                              ((item.payments as Row[]) || []).some(
                                (payment) => payment.status === 'PENDING',
                              ) && (
                                <button
                                  className="text-action"
                                  onClick={() => {
                                    const payment = ((item.payments as Row[]) || []).find(
                                      (value) => value.status === 'PENDING',
                                    )
                                    if (payment)
                                      void adminStatus((sessionToken) =>
                                        confirmCash(sessionToken, String(payment.id)),
                                      )
                                  }}
                                >
                                  Espèces reçues
                                </button>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {adminTab === 'payments' && (
                <div className="admin-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Montant</th>
                        <th>Moyen</th>
                        <th>État</th>
                        <th>Remboursement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows('payments').map((item) => (
                        <tr key={String(item.id)}>
                          <td>{String((item.user as Row)?.email)}</td>
                          <td>{money(Number(item.amount))}</td>
                          <td>{String(item.method)}</td>
                          <td>{stateLabel(item.status)}</td>
                          <td>
                            {String(item.status) === 'REFUND_PENDING' && (
                              <form
                                onSubmit={(event) =>
                                  runForm(event, async (data) => {
                                    if (!token) return
                                    await confirmRefund(
                                      token,
                                      String(item.id),
                                      String(data.get('reference')),
                                    )
                                    await refreshAdmin()
                                    setNotice('Remboursement enregistré.')
                                  })
                                }
                              >
                                <label>
                                  Référence prestataire
                                  <input name="reference" required minLength={3} />
                                </label>
                                <button className="button button-dark" disabled={busy}>
                                  Confirmer après remboursement
                                </button>
                              </form>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {adminTab === 'customers' && (
                <div className="admin-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>E-mail</th>
                        <th>Téléphone</th>
                        <th>Inscription</th>
                        <th>Rôle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows('customers').map((item) => (
                        <tr key={String(item.id)}>
                          <td>
                            <strong>
                              {String(item.firstName)} {String(item.lastName)}
                            </strong>
                          </td>
                          <td>{String(item.email)}</td>
                          <td>{String(item.phone)}</td>
                          <td>{dateLabel(String(item.createdAt))}</td>
                          <td>
                            {user?.role === 'ADMIN' ? (
                              <select
                                value={String(item.role)}
                                disabled={String(item.id) === user.id}
                                onChange={(event) =>
                                  void adminStatus((sessionToken) =>
                                    changeUserRole(
                                      sessionToken,
                                      String(item.id),
                                      event.target.value as 'CUSTOMER' | 'STAFF' | 'ADMIN',
                                    ),
                                  )
                                }
                              >
                                <option value="CUSTOMER">Client</option>
                                <option value="STAFF">Staff</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                            ) : (
                              stateLabel(item.role)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {adminTab === 'content' && (
                <div className="admin-columns">
                  {contents.map((content) => (
                    <form
                      className="admin-form"
                      key={content.slug}
                      onSubmit={(event) =>
                        runForm(event, async (data) => {
                          if (!token) return
                          await saveContent(token, content.slug, {
                            title: String(data.get('title')),
                            body: String(data.get('body')),
                            published: data.get('published') === 'on',
                          })
                          setContents((await listContents(token)).contents)
                          setNotice('Contenu enregistré.')
                        })
                      }
                    >
                      <h3>{content.slug}</h3>
                      <label>
                        Titre
                        <input name="title" defaultValue={content.title} required />
                      </label>
                      <label>
                        Contenu
                        <textarea name="body" defaultValue={content.body} rows={8} required />
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          name="published"
                          defaultChecked={content.published}
                        />{' '}
                        Publié
                      </label>
                      <button className="button button-dark" disabled={busy}>
                        Enregistrer
                      </button>
                    </form>
                  ))}
                </div>
              )}
              {adminTab === 'check-in' && (
                <form
                  className="admin-form"
                  onSubmit={(event) =>
                    runForm(event, async (data) => {
                      if (!token) return
                      await checkIn(token, String(data.get('secret')))
                      setNotice('Participant enregistré.')
                    })
                  }
                >
                  <label>
                    Code du billet
                    <input name="secret" required />
                  </label>
                  <button className="button button-dark" disabled={busy}>
                    Enregistrer l’arrivée
                  </button>
                </form>
              )}
              {adminTab === 'messages' && (
                <div className="message-list">
                  {rows('messages').map((item) => (
                    <article className="message-row" key={String(item.id)}>
                      <div>
                        <strong>
                          {String(item.name)} · {String(item.email)}
                        </strong>
                        <p>{String(item.message)}</p>
                      </div>
                      <select
                        value={String(item.status)}
                        onChange={(event) =>
                          void adminStatus((sessionToken) =>
                            modifierEtatMessage(sessionToken, String(item.id), {
                              status: event.target.value,
                            }),
                          )
                        }
                      >
                        <option value="NEW">Nouveau</option>
                        <option value="READ">Lu</option>
                        <option value="REPLIED">Répondu</option>
                      </select>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="admin-gate">
            <span className="eyebrow">Accès sécurisé</span>
            <h2>Connectez-vous avec un compte administrateur.</h2>
            <a className="button button-dark" href="#/login">
              Connexion <ArrowRight size={15} />
            </a>
          </div>
        )}
      </main>
    )
  }

  return (
    <div className="site-shell">
      <div className="announcement">
        <span>Dakar, Sénégal</span>
        <span>Les rencontres changent tout.</span>
        <a href="#/activities">
          Découvrir le programme <ArrowRight size={13} />
        </a>
      </div>
      <header className="site-header">
        <a className="wordmark" href="#/">
          neneen<span>.</span>
        </a>
        <button
          className="mobile-menu-button"
          aria-label="Menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav className={menuOpen ? 'main-nav is-open' : 'main-nav'}>
          <a href="#/activities">Les sorties</a>
          <a href="#/calendar">Calendrier</a>
          <a href="#/shop">La boutique</a>
          <a href="#/about">À propos</a>
          {user && ['ADMIN', 'STAFF'].includes(user.role) && <a href="#/admin">Administration</a>}
        </nav>
        <div className="header-actions">
          <a className="account-link" href={user ? '#/account' : '#/login'}>
            <CircleUserRound size={17} />
            <span>{user?.firstName || 'Mon compte'}</span>
          </a>
          <a className="bag-link" href="#/cart" aria-label={`Panier, ${cartCount} articles`}>
            <ShoppingBag size={18} />
            <span>{cartCount}</span>
          </a>
        </div>
      </header>
      {notice && (
        <div className="notice" role="status">
          <Check size={16} />
          {notice}
          <button onClick={() => setNotice('')} aria-label="Fermer">
            <X size={14} />
          </button>
        </div>
      )}
      {(error || catalog.error) && (
        <div className="error-banner" role="alert">
          {error || catalog.error?.message}
          <button onClick={() => setError('')} aria-label="Fermer">
            <X size={14} />
          </button>
        </div>
      )}

      {route === '/' && (
        <main>
          <section className="hero-section">
            <div className="hero-image" />
            <div className="hero-content">
              <span className="eyebrow light">Dakar · Sénégal · Ensemble</span>
              <h1>
                La vie est plus belle <em>à plusieurs.</em>
              </h1>
              <p>
                Des sorties qui rapprochent, des histoires qui restent. Trouvez votre prochain
                rendez-vous avec neneen.
              </p>
              <div className="hero-actions">
                <a className="button button-light" href="#/activities">
                  Trouver une sortie <ArrowRight size={17} />
                </a>
                <a className="hero-text-link" href="#/shop">
                  Voir la collection
                </a>
              </div>
            </div>
            <span className="hero-index">
              01 <i /> 03
            </span>
            <a href="#upcoming" className="hero-scroll">
              Défiler <ArrowDownRight size={16} />
            </a>
          </section>
          <section className="intro-strip">
            <span className="eyebrow">Notre promesse</span>
            <p>
              Des expériences pensées avec soin, au rythme de Dakar, pour faire de nouvelles
              rencontres.
            </p>
            <a href="#/contact">
              En savoir plus <ArrowRight size={15} />
            </a>
          </section>
          <section className="content-section" id="upcoming">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Le prochain rendez-vous</span>
                <h2>
                  À vivre bientôt<span className="dot">.</span>
                </h2>
              </div>
              <a className="text-action" href="#/activities">
                Tout le programme <ArrowRight size={16} />
              </a>
            </div>
            {catalogLoading ? (
              <div className="loading-state" role="status">
                Les prochaines sorties arrivent…
              </div>
            ) : (
              <div className="activity-grid">
                {[...activities]
                  .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
                  .slice(0, 3)
                  .map(activityCard)}
              </div>
            )}
            {activities.length === 0 && (
              <div className="empty-state">Les prochaines sorties arrivent bientôt.</div>
            )}
          </section>
          <section className="editorial-section">
            <div className="editorial-copy">
              <span className="eyebrow">Se rencontrer autrement</span>
              <h2>
                Un agenda ouvert.
                <br />
                <em>Des liens bien réels.</em>
              </h2>
              <p>
                Une excursion au grand air, un afterwork sans pression ou une belle soirée à
                célébrer. Choisissez l’ambiance, on s’occupe du reste.
              </p>
              <a className="button button-dark" href="#/activities">
                Explorer les sorties <ArrowRight size={17} />
              </a>
            </div>
            <div className="editorial-photo" />
          </section>
          <section className="content-section shop-preview">
            <div className="section-heading">
              <div>
                <span className="eyebrow">À porter au quotidien</span>
                <h2>
                  La collection neneen<span className="dot">.</span>
                </h2>
              </div>
              <a className="text-action" href="#/shop">
                Toute la boutique <ArrowRight size={16} />
              </a>
            </div>
            <div className="product-grid">{products.slice(0, 3).map(productCard)}</div>
          </section>
        </main>
      )}

      {route === '/activities' && (
        <main className="page-content">
          <div className="page-intro">
            <span className="eyebrow">Le calendrier neneen</span>
            <h1>
              On se retrouve <em>bientôt.</em>
            </h1>
            <p>Choisissez votre prochaine expérience au départ de Dakar.</p>
          </div>
          <div className="filter-row">
            {[
              ['ALL', 'Tout'],
              ['EXCURSION', 'Excursions'],
              ['AFTERWORK', 'Afterworks'],
              ['EVENT', 'Événements'],
            ].map(([value, label]) => (
              <button
                className={activityFilter === value ? 'filter-button active' : 'filter-button'}
                key={value}
                onClick={() => setActivityFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {catalogLoading ? (
            <div className="loading-state" role="status">
              Chargement du programme…
            </div>
          ) : (
            <div className="activity-grid">
              {activities
                .filter((item) => activityFilter === 'ALL' || item.type === activityFilter)
                .map(activityCard)}
            </div>
          )}
          {activities.length === 0 && (
            <div className="empty-state">Aucune activité publiée pour le moment.</div>
          )}
        </main>
      )}

      {route === '/calendar' && (
        <main className="page-content narrow-content">
          <div className="page-intro">
            <span className="eyebrow">Les dates à retenir</span>
            <h1>
              Le calendrier<span className="dot">.</span>
            </h1>
            <p>Un aperçu de nos prochains rendez-vous à Dakar.</p>
          </div>
          <div className="filter-row">
            {[
              ['ALL', 'Tout'],
              ['EXCURSION', 'Excursions'],
              ['AFTERWORK', 'Afterworks'],
              ['EVENT', 'Événements'],
            ].map(([value, label]) => (
              <button
                className={activityFilter === value ? 'filter-button active' : 'filter-button'}
                key={value}
                onClick={() => setActivityFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
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
      )}

      {detailActivity && (
        <main className="page-content detail-page">
          <a className="back-link" href="#/activities">
            ← Toutes les sorties
          </a>
          <div
            className="detail-photo"
            style={{
              backgroundImage: `url(${detailActivity.imageUrl || photos[detailActivity.type]})`,
            }}
          >
            <span className="eyebrow light">{typeLabel(detailActivity.type)}</span>
          </div>
          <div className="detail-layout">
            <div>
              <span className="eyebrow">
                {dateLabel(detailActivity.startsAt)} · {detailActivity.location}
              </span>
              <h1>{detailActivity.title}</h1>
              <p className="detail-description">{detailActivity.description}</p>
              {detailActivity.duration && (
                <p className="activity-duration">
                  <span className="eyebrow">Durée</span>
                  {detailActivity.duration}
                </p>
              )}
              {detailActivity.schedule?.length > 0 && (
                <>
                  <h2>Le programme</h2>
                  <ol className="itinerary-list">
                    {detailActivity.schedule.map((step, index) => (
                      <li key={`${step}-${index}`}>{step}</li>
                    ))}
                  </ol>
                </>
              )}
              {detailActivity.included?.length > 0 && (
                <>
                  <h2>Inclus dans votre réservation</h2>
                  <ul className="included-list">
                    {detailActivity.included.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
              {detailActivity.bringList && (
                <>
                  <h2>À prévoir</h2>
                  <p>{detailActivity.bringList}</p>
                </>
              )}
            </div>
            <aside className="booking-card">
              <span className="eyebrow">Votre prochaine sortie</span>
              <strong className="large-price">{money(detailActivity.price)}</strong>
              <span className="muted">
                par personne · {detailActivity.capacity - detailActivity.reserved} places restantes
              </span>
              <a className="button button-dark full-button" href={`#/booking/${detailActivity.id}`}>
                Réserver ma place <ArrowRight size={16} />
              </a>
              {whatsappNumber && (
                <a
                  className="text-action"
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Bonjour, j’ai une question sur ${detailActivity.title}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Une question sur l’activité ? WhatsApp
                </a>
              )}
              <small>Retrouvez votre réservation depuis votre espace membre.</small>
            </aside>
          </div>
        </main>
      )}

      {route === '/shop' && (
        <main className="page-content">
          <div className="page-intro">
            <span className="eyebrow">La collection neneen</span>
            <h1>
              Build <em>Different.</em>
            </h1>
            <p>Des essentiels avec un état d’esprit : construire ce qui nous ressemble.</p>
          </div>
          {catalogLoading ? (
            <div className="loading-state" role="status">
              Chargement de la collection…
            </div>
          ) : (
            <div className="product-grid">{products.map(productCard)}</div>
          )}
          {products.length === 0 && (
            <div className="empty-state">La collection revient bientôt.</div>
          )}
        </main>
      )}

      {detailProduct && (
        <main className="page-content product-detail-page">
          <a className="back-link" href="#/shop">
            ← Retour à la boutique
          </a>
          <div className="product-detail-layout">
            <div
              className={`product-detail-image tone-${detailProduct.color.toLowerCase().replace(/[^a-z]/g, '')}`}
              style={
                detailProduct.imageUrl
                  ? { backgroundImage: `url(${detailProduct.imageUrl})` }
                  : undefined
              }
            >
              <span className="product-mark">n.</span>
              <span className="eyebrow">Collection Build Different</span>
            </div>
            <section className="product-detail-copy">
              <span className="eyebrow">neneen · {detailProduct.color}</span>
              <h1>{detailProduct.name}</h1>
              <strong className="large-price">{money(detailProduct.price)}</strong>
              <p>{detailProduct.description}</p>
              <p className="muted">{detailProduct.stock} pièce(s) disponible(s)</p>
              <label className="form-label">
                Choisir une taille
                <select
                  value={
                    detailProduct.sizes.includes(selectedSize)
                      ? selectedSize
                      : detailProduct.sizes[0]
                  }
                  onChange={(event) => setSelectedSize(event.target.value)}
                >
                  {detailProduct.sizes.map((size) => (
                    <option
                      value={size}
                      key={size}
                      disabled={stockForSize(detailProduct, size) === 0}
                    >
                      {size} {stockForSize(detailProduct, size) === 0 ? '— épuisé' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="button button-dark full-button"
                disabled={
                  stockForSize(
                    detailProduct,
                    detailProduct.sizes.includes(selectedSize)
                      ? selectedSize
                      : detailProduct.sizes[0],
                  ) < 1
                }
                onClick={() => {
                  const size = detailProduct.sizes.includes(selectedSize)
                    ? selectedSize
                    : detailProduct.sizes[0]
                  changeCart(detailProduct, size, 1)
                  setNotice('Article ajouté à votre panier.')
                }}
              >
                {stockForSize(
                  detailProduct,
                  detailProduct.sizes.includes(selectedSize)
                    ? selectedSize
                    : detailProduct.sizes[0],
                ) > 0
                  ? 'Ajouter au panier'
                  : 'Rupture de stock'}{' '}
                <ShoppingBag size={16} />
              </button>
              <div className="product-assurance">
                <span>Retrait à Dakar</span>
                <span>Paiement à la livraison disponible</span>
              </div>
            </section>
          </div>
          <section className="content-section related-products">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Complétez votre tenue</span>
                <h2>
                  À découvrir aussi<span className="dot">.</span>
                </h2>
              </div>
            </div>
            <div className="product-grid">
              {products
                .filter((product) => product.id !== detailProduct.id)
                .slice(0, 3)
                .map(productCard)}
            </div>
          </section>
        </main>
      )}

      {route === '/cart' && (
        <main className="page-content narrow-content">
          <div className="page-intro">
            <span className="eyebrow">La boutique</span>
            <h1>
              Votre panier<span className="dot">.</span>
            </h1>
          </div>
          {cart.length ? (
            <>
              <div className="cart-list">
                {cart.map((line) => (
                  <article className="cart-row" key={`${line.productId}-${line.size}`}>
                    <div className="cart-swatch">n.</div>
                    <div className="cart-product">
                      <strong>{line.name}</strong>
                      <span>
                        {line.color} · Taille {line.size}
                      </span>
                    </div>
                    <div className="quantity-control">
                      <button
                        onClick={() => {
                          const product = products.find((item) => item.id === line.productId)
                          if (product) changeCart(product, line.size, -1)
                        }}
                        aria-label="Diminuer"
                      >
                        <Minus size={14} />
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        onClick={() => {
                          const product = products.find((item) => item.id === line.productId)
                          if (product) changeCart(product, line.size, 1)
                        }}
                        aria-label="Augmenter"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <strong>{money(line.price * line.quantity)}</strong>
                  </article>
                ))}
              </div>
              <div className="cart-summary">
                <span>Sous-total</span>
                <strong>{money(cartTotal)}</strong>
                <small>Livraison calculée à l’étape suivante.</small>
                <a
                  className="button button-dark"
                  href={user ? '#/checkout' : '#/login'}
                  onClick={() => {
                    if (!user) sessionStorage.setItem('neneen_after_login', '/checkout')
                  }}
                >
                  Continuer la commande <ArrowRight size={16} />
                </a>
              </div>
            </>
          ) : (
            <div className="empty-state">
              Votre panier est vide. <a href="#/shop">Découvrir la collection</a>
            </div>
          )}
        </main>
      )}

      {route === '/login' && (
        <main className="page-content auth-layout">
          <div className="auth-art">
            <span className="eyebrow light">neneen · Dakar</span>
            <p>Les plus beaux souvenirs commencent souvent par un « bonjour ».</p>
          </div>
          <section className="auth-panel">
            <span className="eyebrow">Espace membre</span>
            <h1>
              Ravi de vous <em>revoir.</em>
            </h1>
            <p>Connectez-vous ou créez votre compte pour réserver une sortie.</p>
            <AccountForms
              onSuccess={(result) => {
                void signIn(result)
              }}
              busy={busy}
              setBusy={setBusy}
              setError={setError}
            />
            <small className="muted">
              Prénom, nom et téléphone sont nécessaires à la création du compte.
            </small>
            <a className="text-action" href="#/forgot-password">
              Mot de passe oublié ?
            </a>
          </section>
        </main>
      )}

      {route === '/forgot-password' && (
        <main className="page-content narrow-content">
          <h1>Mot de passe oublié</h1>
          <form
            className="checkout-form"
            onSubmit={(event) =>
              runForm(event, async (data) => {
                const result = await forgotPassword({ email: data.get('email') })
                setNotice(result.message)
              })
            }
          >
            <label className="form-label">
              Adresse e-mail
              <input name="email" type="email" required />
            </label>
            <button className="button button-dark" disabled={busy}>
              Recevoir le lien
            </button>
          </form>
        </main>
      )}
      {route.startsWith('/reset-password') && (
        <main className="page-content narrow-content">
          <h1>Nouveau mot de passe</h1>
          <form
            className="checkout-form"
            onSubmit={(event) =>
              runForm(event, async (data) => {
                const token = new URLSearchParams(location.hash.split('?')[1]).get('token')
                const result = await resetPassword({ token, password: data.get('password') })
                setNotice(result.message)
                location.hash = '/login'
              })
            }
          >
            <label className="form-label">
              Nouveau mot de passe
              <input name="password" type="password" minLength={6} required />
            </label>
            <button className="button button-dark" disabled={busy}>
              Réinitialiser
            </button>
          </form>
        </main>
      )}
      {route.startsWith('/verify-email') && (
        <main className="page-content narrow-content">
          <h1>Vérifier mon adresse e-mail</h1>
          <button
            className="button button-dark"
            onClick={() => {
              const token = new URLSearchParams(location.hash.split('?')[1]).get('token')
              void verifyEmail({ token })
                .then((result) => {
                  setNotice(result.message)
                  location.hash = '/account'
                })
                .catch((reason) => setError((reason as Error).message))
            }}
          >
            Vérifier mon adresse
          </button>
        </main>
      )}
      {bookingActivity && (
        <main className="page-content narrow-content">
          <div className="page-intro">
            <span className="eyebrow">Réserver une sortie</span>
            <h1>
              On vous garde <em>une place.</em>
            </h1>
          </div>
          {bookingActivity.capacity <= bookingActivity.reserved && (
            <button
              className="button button-dark"
              onClick={() => {
                if (!token) {
                  sessionStorage.setItem('neneen_after_login', route)
                  location.hash = '/login'
                  return
                }
                void joinWaitlist(token, bookingActivity.id)
                  .then(() => setNotice('Vous êtes sur la liste d’attente.'))
                  .catch((error) => setError((error as Error).message))
              }}
            >
              Rejoindre la liste d’attente
            </button>
          )}
          {user && token && bookingActivity.capacity > bookingActivity.reserved ? (
            <form
              className="checkout-form"
              noValidate
              onSubmit={(event) =>
                runForm(event, async (data) => {
                  if (!token) throw new Error('Reconnectez-vous pour réserver cette activité.')
                  const result = await reserverActivite(
                    {
                      activityId: bookingActivity.id,
                      quantity: Number(data.get('quantity')),
                      paymentMethod: String(data.get('paymentMethod') || ''),
                    },
                    token,
                  )
                  if (String(data.get('paymentMethod')) !== 'CASH') {
                    const payment = await initiatePayment(token, {
                      bookingId: (result.booking as { id: string }).id,
                      method: String(data.get('paymentMethod')),
                      idempotencyKey: crypto.randomUUID(),
                    })
                    if (payment.checkoutUrl) {
                      location.href = payment.checkoutUrl
                      return
                    }
                  }
                  setNotice(result.message)
                  location.hash = '/account'
                })
              }
            >
              <div className="checkout-line">
                <div>
                  <strong>{bookingActivity.title}</strong>
                  <span>
                    {dateLabel(bookingActivity.startsAt)} · {bookingActivity.location}
                  </span>
                </div>
                <strong>{money(bookingActivity.price)}</strong>
              </div>
              <label className="form-label">
                Nombre de places
                <select name="quantity">
                  {Array.from(
                    { length: Math.min(bookingActivity.capacity - bookingActivity.reserved, 100) },
                    (_, index) => (
                      <option value={index + 1} key={index}>
                        {index + 1}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className="form-label">
                Paiement
                <select name="paymentMethod">
                  {paymentEnabled && <option value="WAVE">Wave</option>}
                  {paymentEnabled && <option value="ORANGE_MONEY">Orange Money</option>}
                  {paymentEnabled && <option value="CARD">Carte bancaire</option>}
                  <option value="CASH">Espèces sur place</option>
                </select>
              </label>
              <p className="payment-note">
                Les places sont gardées pendant le paiement en ligne. Paiement sur place disponible.
              </p>
              <button
                className="button button-dark full-button"
                disabled={busy || bookingActivity.capacity <= bookingActivity.reserved}
              >
                Confirmer la réservation <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <a
              className="button button-dark"
              href="#/login"
              onClick={() => sessionStorage.setItem('neneen_after_login', route)}
            >
              Connectez-vous pour réserver <ArrowRight size={16} />
            </a>
          )}
        </main>
      )}

      {route === '/checkout' &&
        (user ? (
          <main className="page-content narrow-content">
            <div className="page-intro">
              <span className="eyebrow">Finaliser votre commande</span>
              <h1>
                Presque <em>à vous.</em>
              </h1>
            </div>
            <form
              className="checkout-form"
              noValidate
              onSubmit={(event) =>
                runForm(event, async (data) => {
                  if (!token) throw new Error('Reconnectez-vous pour confirmer votre commande.')
                  const result = await passerCommande(
                    {
                      shippingAddress: data.get('shippingAddress'),
                      paymentMethod: String(data.get('paymentMethod') || ''),
                      shippingFee: Number(data.get('shippingFee')),
                      items: cart.map(({ productId, size, quantity }) => ({
                        productId,
                        size,
                        quantity,
                      })),
                    },
                    token,
                  )
                  setCart([])
                  if (String(data.get('paymentMethod')) !== 'CASH') {
                    const payment = await initiatePayment(token, {
                      orderId: result.order.id,
                      method: String(data.get('paymentMethod')),
                      idempotencyKey: crypto.randomUUID(),
                    })
                    if (payment.checkoutUrl) {
                      location.href = payment.checkoutUrl
                      return
                    }
                  }
                  setNotice(`${result.message} Référence ${result.order.id}.`)
                  location.hash = '/account'
                })
              }
            >
              <div className="checkout-line">
                <span>{cartCount} article(s)</span>
                <strong>{money(cartTotal)}</strong>
              </div>
              <label className="form-label">
                Adresse ou consigne de retrait
                <textarea name="shippingAddress" required minLength={5} />
              </label>
              <label className="form-label">
                Livraison
                <select name="shippingFee">
                  <option value="0">Retrait sur place · offert</option>
                  <option value="2000">Dakar · 2 000 FCFA</option>
                  <option value="4000">Hors Dakar · 4 000 FCFA</option>
                </select>
              </label>
              <label className="form-label">
                Paiement
                <select name="paymentMethod">
                  {paymentEnabled && <option value="WAVE">Wave</option>}
                  {paymentEnabled && <option value="ORANGE_MONEY">Orange Money</option>}
                  {paymentEnabled && <option value="CARD">Carte bancaire</option>}
                  <option value="CASH">Paiement à la livraison</option>
                </select>
              </label>
              <p className="payment-note">
                Vous serez redirigé vers la page de paiement si vous choisissez un moyen en ligne.
              </p>
              <button className="button button-dark full-button" disabled={busy}>
                Confirmer la commande <ArrowRight size={16} />
              </button>
            </form>
          </main>
        ) : (
          <main className="page-content narrow-content">
            <div className="admin-gate">
              <span className="eyebrow">Espace membre</span>
              <h2>Connectez-vous pour finaliser votre commande.</h2>
              <a className="button button-dark" href="#/login">
                Se connecter <ArrowRight size={16} />
              </a>
            </div>
          </main>
        ))}

      {route === '/account' && user && (
        <main className="page-content">
          <div className="account-heading">
            <div>
              <span className="eyebrow">Votre espace</span>
              <h1>
                Bonjour, {user?.firstName}
                <span className="dot">.</span>
              </h1>
              <p>
                {user?.email} · {user?.phone}
              </p>
            </div>
            <button className="text-action" onClick={signOut}>
              Se déconnecter <ArrowRight size={15} />
            </button>
          </div>
          {accountLoading ? (
            <div className="loading-state" role="status">
              Chargement de votre espace…
            </div>
          ) : (
            <div className="account-columns">
              {[
                ['Mes réservations', bookings, 'activity'],
                ['Mes commandes', orders, 'order'],
              ].map(([title, rows, kind]) => (
                <section key={String(title)}>
                  <h2>{title as string}</h2>
                  {(rows as Row[]).length ? (
                    (rows as Row[]).map((item) => (
                      <article className="account-row" key={String(item.id)}>
                        <div>
                          <span className="eyebrow">
                            {dateLabel(
                              String(
                                kind === 'activity'
                                  ? (item.activity as Row)?.startsAt
                                  : item.createdAt,
                              ),
                            )}
                          </span>
                          <h3>
                            {String(
                              kind === 'activity'
                                ? (item.activity as Row)?.title
                                : `Commande ${String(item.id).slice(-7)}`,
                            )}
                          </h3>
                          <span className="muted">{money(Number(item.total))}</span>
                        </div>
                        <div>
                          <span className="status">{stateLabel(item.status)}</span>
                          {kind === 'activity' && String(item.status) === 'CONFIRMED' && (
                            <button
                              className="text-action"
                              onClick={() => {
                                if (token)
                                  void getTicket(token, String(item.id))
                                    .then((result) => setTicketQr(result.qr))
                                    .catch((reason) => setError((reason as Error).message))
                              }}
                            >
                              Voir mon billet
                            </button>
                          )}
                          {kind === 'activity' &&
                            ['PENDING', 'CONFIRMED'].includes(String(item.status)) && (
                              <button
                                className="text-action"
                                onClick={() => {
                                  if (token)
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
                          {String(item.status) === 'PENDING' &&
                            String(item.paymentMethod) !== 'CASH' &&
                            paymentEnabled && (
                              <button
                                className="text-action"
                                onClick={() => {
                                  if (token)
                                    void initiatePayment(token, {
                                      [kind === 'activity' ? 'bookingId' : 'orderId']: String(
                                        item.id,
                                      ),
                                      method: String(item.paymentMethod),
                                      idempotencyKey: crypto.randomUUID(),
                                    })
                                      .then((payment) => {
                                        if (payment.checkoutUrl) location.href = payment.checkoutUrl
                                      })
                                      .catch((reason) => setError((reason as Error).message))
                                }}
                              >
                                Payer
                              </button>
                            )}
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="muted">Rien à afficher pour le moment.</p>
                  )}
                </section>
              ))}
            </div>
          )}
          {ticketQr && (
            <div className="ticket-modal" role="dialog" aria-label="Billet QR">
              <button className="text-action" onClick={() => setTicketQr(null)}>
                Fermer
              </button>
              <img src={ticketQr} alt="Code QR du billet" />
            </div>
          )}
          <section className="account-settings">
            <h2>Mon profil</h2>
            <form
              onSubmit={(event) =>
                runForm(event, async (data) => {
                  if (!token) return
                  const result = await saveProfile(token, Object.fromEntries(data.entries()))
                  setUser(result.user)
                  localStorage.setItem('neneen_user', JSON.stringify(result.user))
                  setNotice('Profil enregistré.')
                })
              }
            >
              <label className="form-label">
                Prénom
                <input name="firstName" defaultValue={user.firstName} required />
              </label>
              <label className="form-label">
                Nom
                <input name="lastName" defaultValue={user.lastName} required />
              </label>
              <label className="form-label">
                Téléphone WhatsApp
                <input name="phone" defaultValue={user.phone} required />
              </label>
              <button className="button button-dark" disabled={busy}>
                Enregistrer
              </button>
            </form>
            <h2>Mot de passe</h2>
            <form
              onSubmit={(event) =>
                runForm(event, async (data) => {
                  if (!token) return
                  await changePassword(token, Object.fromEntries(data.entries()))
                  setNotice('Mot de passe modifié. Reconnectez-vous.')
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
                Changer le mot de passe
              </button>
            </form>
            {!user.emailVerifiedAt && (
              <button
                className="text-action"
                onClick={() => {
                  if (token)
                    void resendVerification(token)
                      .then(() => setNotice('Un nouveau lien de vérification sera envoyé.'))
                      .catch((reason) => setError((reason as Error).message))
                }}
              >
                Renvoyer le lien de vérification
              </button>
            )}
            <h2>Supprimer mon compte</h2>
            <form
              onSubmit={(event) =>
                runForm(event, async (data) => {
                  if (!token) return
                  await deleteAccount(token, String(data.get('password')))
                  signOut()
                })
              }
            >
              <label className="form-label">
                Confirmer avec le mot de passe
                <input name="password" type="password" required />
              </label>
              <button className="text-action" disabled={busy}>
                Supprimer définitivement
              </button>
            </form>
          </section>
          <section className="account-settings">
            <h2>Mes paiements</h2>
            {payments.map((payment) => (
              <div className="account-row" key={payment.id}>
                <span>
                  {money(payment.amount)} · {stateLabel(payment.status)}
                </span>
                {payment.status === 'SUCCEEDED' && (
                  <a
                    href={
                      (import.meta.env.VITE_API_URL || 'http://localhost:4000/api') +
                      '/payments/' +
                      payment.id +
                      '/receipt.pdf'
                    }
                    onClick={(event) => {
                      event.preventDefault()
                      if (!token) return
                      void fetch(
                        (import.meta.env.VITE_API_URL || 'http://localhost:4000/api') +
                          '/payments/' +
                          payment.id +
                          '/receipt.pdf',
                        { headers: { Authorization: `Bearer ${token}` } },
                      )
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
                    Télécharger le reçu
                  </a>
                )}
              </div>
            ))}
          </section>
        </main>
      )}

      {route === '/account' && !user && (
        <main className="page-content narrow-content">
          <div className="admin-gate">
            <span className="eyebrow">Espace membre</span>
            <h2>Connectez-vous pour retrouver vos réservations et commandes.</h2>
            <a className="button button-dark" href="#/login">
              Se connecter <ArrowRight size={16} />
            </a>
          </div>
        </main>
      )}

      {route === '/contact' && (
        <main className="page-content contact-layout">
          <div>
            <span className="eyebrow">Une question, une idée ?</span>
            <h1>
              On vous <em>écoute.</em>
            </h1>
            <p>Notre équipe est à Dakar et vous répond au plus vite.</p>
            {whatsappNumber && (
              <a className="contact-detail" href={`https://wa.me/${whatsappNumber}`}>
                <span>WhatsApp</span>+{whatsappNumber} <ArrowRight size={16} />
              </a>
            )}
            {contactEmail && (
              <a className="contact-detail" href={`mailto:${contactEmail}`}>
                <span>E-mail</span>
                {contactEmail} <ArrowRight size={16} />
              </a>
            )}
          </div>
          <form
            className="checkout-form"
            noValidate
            onSubmit={(event) => {
              const form = event.currentTarget
              return runForm(event, async (data) => {
                await envoyerMessage(Object.fromEntries(data.entries()))
                setNotice('Votre message a bien été envoyé.')
                form.reset()
              })
            }}
          >
            <label className="form-label">
              Votre nom
              <input name="name" required />
            </label>
            <label className="form-label">
              Votre e-mail
              <input name="email" type="email" required />
            </label>
            <label className="form-label">
              Votre message
              <textarea name="message" required minLength={10} rows={5} />
            </label>
            <button className="button button-dark" disabled={busy}>
              Envoyer le message <ArrowRight size={16} />
            </button>
          </form>
        </main>
      )}

      {route === '/about' && (
        <main className="page-content about-page">
          <div className="page-intro">
            <span className="eyebrow">Notre style, notre identité</span>
            <h1>
              À propos de <em>neneen.</em>
            </h1>
            <p>Une invitation à sortir, se rencontrer et faire communauté.</p>
          </div>
          <div className="about-feature">
            <div className="about-photo" />
            <div>
              <span className="eyebrow">Notre mission</span>
              <h2>Rendre les rencontres simples.</h2>
              <p>
                {managedContent?.body ||
                  'neneen imagine des sorties, des afterworks et des événements accessibles, bien encadrés et ouverts à toutes celles et ceux qui ont envie de partager un bon moment.'}
              </p>
              <p>
                Depuis Dakar, nous créons des occasions de découvrir autrement nos lieux, nos
                histoires et les personnes qui font notre quotidien.
              </p>
              <a className="button button-dark" href="#/activities">
                Venez comme vous êtes <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </main>
      )}

      {['faq', 'cgv', 'mentions'].includes(parts[0]) && (
        <main className="page-content narrow-content legal-page">
          <span className="eyebrow">Informations neneen</span>
          {managedContent ? (
            <>
              <h1>{managedContent.title}</h1>
              <p>{managedContent.body}</p>
            </>
          ) : parts[0] === 'faq' ? (
            <>
              <h1>
                Questions <em>pratiques.</em>
              </h1>
              <details open>
                <summary>Puis-je annuler une réservation ?</summary>
                <p>
                  Une demande d’annulation peut être faite jusqu’à 7 jours avant l’activité. Les
                  modalités de remboursement dépendent du moyen de paiement et des conditions
                  communiquées pour chaque sortie.
                </p>
              </details>
              <details>
                <summary>Que se passe-t-il si une activité est annulée ?</summary>
                <p>
                  neneen vous informe et propose un report ou le remboursement de votre réservation.
                </p>
              </details>
              <details>
                <summary>Quels moyens de paiement sont acceptés ?</summary>
                <p>
                  Wave, Orange Money, carte bancaire ou espèces sur place. Le paiement en ligne sera
                  activé après raccordement du fournisseur.
                </p>
              </details>
              <details>
                <summary>Faut-il un compte pour réserver ?</summary>
                <p>
                  Oui. Votre espace membre regroupe les réservations et commandes associées à votre
                  compte.
                </p>
              </details>
            </>
          ) : parts[0] === 'cgv' ? (
            <>
              <h1>
                Conditions générales <em>de vente.</em>
              </h1>
              <p>
                Les prix sont indiqués en francs CFA. Une commande ou réservation est enregistrée en
                attente tant que le paiement n’a pas été confirmé. Les demandes d’annulation et de
                remboursement sont traitées selon les conditions communiquées pour l’activité ou la
                commande concernée.
              </p>
              <p>
                Les présentes conditions sont à compléter avec les informations légales et les
                coordonnées de l’entreprise avant toute mise en production.
              </p>
            </>
          ) : (
            <>
              <h1>
                Mentions <em>légales.</em>
              </h1>
              <p>neneen · Dakar, Sénégal {contactEmail && `· Contact : ${contactEmail}`}</p>
              <p>
                La raison sociale, le NINEA, le RCCM, le directeur de publication, l’hébergeur et
                les mentions relatives aux données personnelles doivent être ajoutés avant la mise
                en ligne publique.
              </p>
            </>
          )}
        </main>
      )}

      {route === '/admin' && adminView()}
      {((parts[0] === 'activity' && !detailActivity) ||
        (parts[0] === 'product' && !detailProduct) ||
        (parts[0] === 'booking' && !bookingActivity)) && (
        <main className="page-content narrow-content">
          <div className="empty-state">
            <h1>Cette page n’est plus disponible.</h1>
            <p>Le lien a peut-être changé ou l’élément a été retiré.</p>
            <a className="button button-dark" href="#/activities">
              Retour au programme
            </a>
          </div>
        </main>
      )}
      {![
        '/',
        '/activities',
        '/calendar',
        '/shop',
        '/cart',
        '/login',
        '/checkout',
        '/account',
        '/contact',
        '/about',
        '/faq',
        '/cgv',
        '/mentions',
        '/admin',
        '/forgot-password',
      ].includes(route) &&
        !route.startsWith('/reset-password') &&
        !route.startsWith('/verify-email') &&
        !detailActivity &&
        !detailProduct &&
        !bookingActivity &&
        !['activity', 'product', 'booking'].includes(parts[0]) && (
          <main className="page-content narrow-content">
            <h1>Page introuvable.</h1>
            <a className="button button-dark" href="#/">
              Retour à l’accueil
            </a>
          </main>
        )}
      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <a className="wordmark" href="#/">
              neneen<span>.</span>
            </a>
            <p>
              Notre style, notre identité.
              <br />
              Dakar, Sénégal
            </p>
          </div>
          <div>
            <span className="eyebrow">Explorer</span>
            <a href="#/activities">Les sorties</a>
            <a href="#/calendar">Calendrier</a>
            <a href="#/shop">La boutique</a>
            <a href="#/about">À propos</a>
            <a href="#/contact">Contact</a>
          </div>
          <div>
            <span className="eyebrow">Informations</span>
            <a href="#/faq">FAQ et annulation</a>
            <a href="#/cgv">Conditions de vente</a>
            <a href="#/mentions">Mentions légales</a>
            {whatsappNumber && (
              <a href={`https://wa.me/${whatsappNumber}`}>
                WhatsApp <ArrowRight size={14} />
              </a>
            )}
          </div>
        </div>
        <form
          className="newsletter-form"
          onSubmit={(event) =>
            runForm(event, async (data) => {
              await subscribeNewsletter(String(data.get('email')))
              setNotice('Inscription à la newsletter enregistrée.')
            })
          }
        >
          <label className="form-label">
            Recevoir la newsletter
            <input type="email" name="email" required />
          </label>
          <button className="button button-dark" disabled={busy}>
            S’inscrire
          </button>
        </form>
        <div className="footer-bottom">
          <span>© neneen 2026 · Dakar, Sénégal</span>
          <span>Conçu pour se retrouver.</span>
          <a href="#/admin">Administration</a>
        </div>
      </footer>
      {selectedProduct && (
        <div className="modal-backdrop">
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <button
              className="modal-close"
              onClick={() => setSelectedProduct(null)}
              aria-label="Fermer"
            >
              <X />
            </button>
            <div
              className={`modal-product-image tone-${selectedProduct.color.toLowerCase().replace(/[^a-z]/g, '')}`}
              style={
                selectedProduct.imageUrl
                  ? { backgroundImage: `url(${selectedProduct.imageUrl})` }
                  : undefined
              }
            >
              <span className="product-mark">n.</span>
            </div>
            <div className="modal-product-copy">
              <span className="eyebrow">Build Different · {selectedProduct.color}</span>
              <h2 id="product-modal-title">{selectedProduct.name}</h2>
              <p>{selectedProduct.description}</p>
              <strong>{money(selectedProduct.price)}</strong>
              <label className="form-label">
                Taille
                <select
                  value={selectedSize}
                  onChange={(event) => setSelectedSize(event.target.value)}
                >
                  {selectedProduct.sizes.map((size) => (
                    <option
                      value={size}
                      key={size}
                      disabled={stockForSize(selectedProduct, size) === 0}
                    >
                      {size} {stockForSize(selectedProduct, size) === 0 ? '— épuisé' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="button button-dark full-button"
                disabled={stockForSize(selectedProduct, selectedSize) < 1}
                onClick={() => {
                  changeCart(selectedProduct, selectedSize, 1)
                  setSelectedProduct(null)
                  setNotice('Article ajouté à votre panier.')
                }}
              >
                Ajouter au panier <ShoppingBag size={16} />
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
