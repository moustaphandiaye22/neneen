import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AuthPage } from './features/auth/AuthPage'
import { SiteFooter } from './components/layout/SiteFooter'
import { SiteHeader } from './components/layout/SiteHeader'
import { FeedbackBanners } from './components/layout/FeedbackBanners'
import { HomePage } from './features/home/HomePage'
import { ShopPage } from './features/shop/ShopPage'
import { ProductCard } from './features/shop/ProductCard'
import { useCart } from './features/shop/useCart'
import { stockForSize } from './features/shop/stock'
import { ActivitiesPage } from './features/activities/ActivitiesPage'
import { CalendarPage } from './features/activities/CalendarPage'
import {
  getPaymentConfig,
  initiatePayment,
  listPayments,
  type Payment,
} from './services/paymentService'
import {
  forgotPassword,
  resetPassword,
  verifyEmail,
  saveProfile,
  changePassword,
  logout,
} from './services/authService'
import { cancelBooking, joinWaitlist, getTicket } from './services/accountService'
import { getContent } from './services/contentService'
import { apiUrl } from './services/api'
import { uploadImage } from './services/uploadService'
import {
  ArrowRight,
  Ban,
  CircleUserRound,
  Download,
  EyeOff,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
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
  getSiteSettings,
  getProductOptions,
  saveSiteSettings,
  type SiteSettings,
} from './services/adminService'
import { listerActivites, reserverActivite } from './services/activityService'
import { chargerEspaceClient } from './services/accountService'
import { envoyerMessage } from './services/contactService'
import { listerProduits, passerCommande } from './services/shopService'
import type { Activity, Product, Row, User } from './types'
import {
  dateLabel,
  money,
  pageTitle,
  paymentMethodLabel,
  photos,
  stateLabel,
  typeLabel,
} from './lib/presentation'
import './site.css'

const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')
const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || ''

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
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null)
  const [productOptions, setProductOptions] = useState<{ colors: string[]; sizes: string[] }>({
    colors: [],
    sizes: [],
  })
  const [activityFilter, setActivityFilter] = useState('ALL')
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [activityFormOpen, setActivityFormOpen] = useState(false)
  const [productFormOpen, setProductFormOpen] = useState(false)
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
    document.title = `${pageTitle(route)} | neneen · Dakar`
  }, [route])
  const catalog = useQuery({
    queryKey: ['catalog'],
    queryFn: () => Promise.all([listerActivites(), listerProduits()]),
  })
  const activities: Activity[] = catalog.data?.[0] ?? []
  const products: Product[] = catalog.data?.[1] ?? []
  const catalogLoading = catalog.isPending
  const {
    cart,
    setCart,
    changeCart,
    resetSync,
    clearCart,
    total: cartTotal,
    count: cartCount,
  } = useCart(token, catalog.data?.[1], setError)
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
    getPaymentConfig()
      .then((result) => setPaymentEnabled(result.enabled))
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
    if (route === '/admin' && token && adminTab === 'settings' && user?.role === 'ADMIN')
      void getSiteSettings(token)
        .then((result) => setSiteSettings(result.settings))
        .catch((reason) => setError((reason as Error).message))
    if (route === '/admin' && token && adminTab === 'products')
      void getProductOptions(token)
        .then((result) =>
          setProductOptions({
            colors: result.colors.map((color) => color.label),
            sizes: result.sizes.map((size) => size.label),
          }),
        )
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
    const nextRoute =
      sessionStorage.getItem('neneen_after_login') ||
      (['ADMIN', 'STAFF'].includes(result.user.role) ? '/admin' : '/account')
    sessionStorage.removeItem('neneen_after_login')
    resetSync()
    location.hash = nextRoute
  }

  function signOut() {
    void logout().catch(() => undefined)
    localStorage.removeItem('neneen_token')
    localStorage.removeItem('neneen_user')
    setToken(null)
    setUser(null)
    clearCart()
    location.hash = '/'
  }

  function selectProduct(product: Product) {
    setSelectedProduct(product)
    setSelectedSize(product.sizes[0] || 'M')
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
      'settings',
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
      settings: 'Paramètres du site',
      'check-in': 'Contrôle des entrées',
    }
    const stats: Array<[string, string | number | undefined]> = [
      ['Membres', adminData.customers as number | undefined],
      ['Activités', adminData.activities as number | undefined],
      ['Réservations', adminData.bookings as number | undefined],
      ['Commandes', adminData.orders as number | undefined],
      ['Messages à lire', adminData.unreadMessages as number | undefined],
      ['Ventes confirmées', money(Number(adminData.revenue || 0))],
    ]
    const activitiesData = Array.isArray(adminData.activities)
      ? (adminData.activities as Activity[])
      : []
    const productsData = Array.isArray(adminData.products) ? (adminData.products as Product[]) : []
    const colorOptions = productOptions.colors
    const sizeOptions = productOptions.sizes
    const rows = (key: string) => (Array.isArray(adminData[key]) ? adminData[key] : []) as Row[]
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
                <button
                  className="icon-button"
                  onClick={() => void refreshAdmin()}
                  title="Actualiser"
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  <span className="sr-only">Actualiser</span>
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
                <>
                  <button
                    className="button button-dark admin-add-button"
                    onClick={() => {
                      setEditActivity(null)
                      setActivityFormOpen(true)
                    }}
                  >
                    Ajouter une activité <Plus size={16} />
                  </button>
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
                          {(Array.isArray(activitiesData) ? activitiesData : []).map((item) => (
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
                                  <Download size={16} aria-hidden="true" />
                                  <span className="sr-only">Exporter les participants</span>
                                </button>
                                <button
                                  className="icon-button"
                                  onClick={() => {
                                    setEditActivity(item)
                                    setActivityFormOpen(true)
                                  }}
                                >
                                  <Pencil size={16} aria-hidden="true" />
                                  <span className="sr-only">Modifier</span>
                                </button>
                                <button
                                  className="icon-button danger"
                                  onClick={() =>
                                    void adminStatus((sessionToken) =>
                                      annulerActivite(sessionToken, item.id),
                                    )
                                  }
                                >
                                  <Ban size={16} aria-hidden="true" />
                                  <span className="sr-only">Annuler</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <form
                      className={
                        activityFormOpen
                          ? 'admin-form admin-editor'
                          : 'admin-form admin-editor admin-editor-closed'
                      }
                      noValidate
                      key={editActivity?.id || 'new-activity'}
                      onSubmit={(event) =>
                        runForm(event, async (data) => {
                          const values = Object.fromEntries(data.entries())
                          const payload = {
                            ...values,
                            imageUrl: String(values.imageUrl || ''),
                            featured: editActivity?.featured || false,
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
                          setActivityFormOpen(false)
                          await refreshAdmin()
                          setNotice('Activité enregistrée.')
                        })
                      }
                    >
                      <button
                        type="button"
                        className="admin-editor-close"
                        onClick={() => setActivityFormOpen(false)}
                        aria-label="Fermer"
                      >
                        <X size={18} />
                      </button>
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
                          <option value="AFTERWORK">Soirée après le travail</option>
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
                        Importer une image
                        <input name="imageFile" type="file" accept="image/*" />
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
                </>
              )}
              {adminTab === 'products' && (
                <>
                  <button
                    className="button button-dark admin-add-button"
                    onClick={() => {
                      setEditProduct(null)
                      setProductFormOpen(true)
                    }}
                  >
                    Ajouter un produit <Plus size={16} />
                  </button>
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
                                <button
                                  className="icon-button"
                                  onClick={() => {
                                    setEditProduct(item)
                                    setProductFormOpen(true)
                                  }}
                                >
                                  <Pencil size={16} aria-hidden="true" />
                                  <span className="sr-only">Modifier</span>
                                </button>
                                <button
                                  className="icon-button danger"
                                  onClick={() =>
                                    void adminStatus((sessionToken) =>
                                      masquerProduit(sessionToken, item.id),
                                    )
                                  }
                                >
                                  <EyeOff size={16} aria-hidden="true" />
                                  <span className="sr-only">Masquer</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <form
                      className={
                        productFormOpen
                          ? 'admin-form admin-editor'
                          : 'admin-form admin-editor admin-editor-closed'
                      }
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
                            sizes: data.getAll('sizes').map(String).filter(Boolean),
                            active: true,
                          }
                          if (!token) throw new Error('Reconnectez-vous pour gérer le catalogue.')
                          const file = data.get('imageFile')
                          if (file instanceof File && file.size > 0)
                            payload.imageUrl = await uploadImage(token, 'products', file)
                          await enregistrerProduit(token, payload, editProduct?.id)
                          setEditProduct(null)
                          setProductFormOpen(false)
                          await refreshAdmin()
                          setNotice('Produit enregistré.')
                        })
                      }
                    >
                      <button
                        type="button"
                        className="admin-editor-close"
                        onClick={() => setProductFormOpen(false)}
                        aria-label="Fermer"
                      >
                        <X size={18} />
                      </button>
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
                        <select
                          name="color"
                          required
                          defaultValue={editProduct?.color || colorOptions[0] || ''}
                        >
                          {colorOptions.map((color) => (
                            <option value={color} key={color}>
                              {color}
                            </option>
                          ))}
                        </select>
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
                        Tailles disponibles
                        <select
                          name="sizes"
                          multiple
                          disabled={Boolean(editProduct)}
                          defaultValue={editProduct?.sizes || sizeOptions}
                        >
                          {sizeOptions.map((size) => (
                            <option value={size} key={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Importer une image
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
                </>
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
                          <td>{paymentMethodLabel(String(item.method))}</td>
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
                                <option value="STAFF">Équipe</option>
                                <option value="ADMIN">Administrateur</option>
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
                            published: data.get('published') === 'true',
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
                        Publication
                        <select
                          name="published"
                          defaultValue={content.published ? 'true' : 'false'}
                        >
                          <option value="true">Publié</option>
                          <option value="false">Brouillon</option>
                        </select>
                      </label>
                      <button className="button button-dark" disabled={busy}>
                        Enregistrer
                      </button>
                    </form>
                  ))}
                </div>
              )}
              {adminTab === 'settings' && siteSettings && user?.role === 'ADMIN' && (
                <form
                  className="admin-form site-settings-form"
                  onSubmit={(event) =>
                    runForm(event, async (data) => {
                      if (!token || !siteSettings) return
                      const result = await saveSiteSettings(token, {
                        siteName: String(data.get('siteName')),
                        slogan: String(data.get('slogan')),
                        contactEmail: String(data.get('contactEmail')),
                        contactPhone: String(data.get('contactPhone')),
                        whatsapp: String(data.get('whatsapp')),
                        address: String(data.get('address')),
                        instagramUrl: String(data.get('instagramUrl')),
                        facebookUrl: String(data.get('facebookUrl')),
                        paymentsLive: siteSettings.paymentsLive,
                      })
                      setSiteSettings(result.settings)
                      setNotice('Paramètres enregistrés.')
                    })
                  }
                >
                  <span className="eyebrow">Configuration générale</span>
                  <h3>Identité et contacts</h3>
                  <div className="field-pair">
                    <label>
                      Nom du site
                      <input name="siteName" defaultValue={siteSettings.siteName} required />
                    </label>
                    <label>
                      Slogan
                      <input name="slogan" defaultValue={siteSettings.slogan} />
                    </label>
                  </div>
                  <div className="field-pair">
                    <label>
                      E-mail
                      <input
                        name="contactEmail"
                        type="email"
                        defaultValue={siteSettings.contactEmail}
                      />
                    </label>
                    <label>
                      Téléphone
                      <input name="contactPhone" defaultValue={siteSettings.contactPhone} />
                    </label>
                  </div>
                  <label>
                    WhatsApp
                    <input name="whatsapp" defaultValue={siteSettings.whatsapp} />
                  </label>
                  <label>
                    Adresse
                    <input name="address" defaultValue={siteSettings.address} />
                  </label>
                  <div className="field-pair">
                    <label>
                      Instagram
                      <input
                        name="instagramUrl"
                        type="url"
                        defaultValue={siteSettings.instagramUrl}
                      />
                    </label>
                    <label>
                      Facebook
                      <input
                        name="facebookUrl"
                        type="url"
                        defaultValue={siteSettings.facebookUrl}
                      />
                    </label>
                  </div>
                  <button className="button button-dark" disabled={busy}>
                    Enregistrer les paramètres
                  </button>
                </form>
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
      <SiteHeader
        userName={user?.firstName}
        cartCount={cartCount}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((open) => !open)}
        onSignOut={signOut}
      />
      <FeedbackBanners
        notice={notice}
        error={error}
        catalogError={catalog.error}
        onDismissNotice={() => setNotice('')}
        onDismissError={() => setError('')}
      />

      {route === '/' && (
        <HomePage
          activities={activities}
          products={products}
          loading={catalogLoading}
          onProductSelect={selectProduct}
        />
      )}

      {route === '/activities' && (
        <ActivitiesPage
          activities={activities}
          loading={catalogLoading}
          activityFilter={activityFilter}
          setActivityFilter={setActivityFilter}
        />
      )}

      {route === '/calendar' && (
        <CalendarPage
          activities={activities}
          loading={catalogLoading}
          activityFilter={activityFilter}
          setActivityFilter={setActivityFilter}
        />
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
        <ShopPage products={products} loading={catalogLoading} onProductSelect={selectProduct} />
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
                .map((product) => (
                  <ProductCard product={product} key={product.id} onSelect={selectProduct} />
                ))}
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
        <AuthPage
          onSuccess={(result) => {
            void signIn(result)
          }}
          busy={busy}
          setBusy={setBusy}
          setError={setError}
        />
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
                    href={apiUrl('/payments/') + payment.id + '/receipt.pdf'}
                    onClick={(event) => {
                      event.preventDefault()
                      if (!token) return
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
      <SiteFooter />
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
