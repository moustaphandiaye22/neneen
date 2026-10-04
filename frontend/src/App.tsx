import { useEffect, useState, type SyntheticEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SiteHeader } from './components/layout/SiteHeader'
import { SiteFooter } from './components/layout/SiteFooter'
import { FeedbackBanners } from './components/layout/FeedbackBanners'
import { AuthPage } from './features/auth/AuthPage'
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './features/auth/ResetPasswordPage'
import { VerifyEmailPage } from './features/auth/VerifyEmailPage'
import { HomePage } from './features/home/HomePage'
import { ShopPage } from './features/shop/ShopPage'
import { ProductDetailPage } from './features/shop/ProductDetailPage'
import { CartPage } from './features/shop/CartPage'
import { CheckoutPage } from './features/shop/CheckoutPage'
import { ProductModal } from './features/shop/ProductModal'
import { useCart } from './features/shop/useCart'
import { ActivitiesPage } from './features/activities/ActivitiesPage'
import { CalendarPage } from './features/activities/CalendarPage'
import { ActivityDetailPage } from './features/activities/ActivityDetailPage'
import { BookingPage } from './features/activities/BookingPage'
import { AccountPage } from './features/account/AccountPage'
import { AdminPage } from './features/admin/AdminPage'
import { ContactPage } from './features/pages/ContactPage'
import { AboutPage } from './features/pages/AboutPage'
import { LegalPage } from './features/pages/LegalPage'
import { NotFoundPage } from './features/pages/NotFoundPage'
import { getPaymentConfig, listPayments, type Payment } from './services/paymentService'
import { logout } from './services/authService'
import { getContent } from './services/contentService'
import { listerActivites } from './services/activityService'
import { listerProduits } from './services/shopService'
import { chargerEspaceClient } from './services/accountService'
import type { Activity, Product, Row, User } from './types'
import { pageTitle } from './lib/presentation'
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
  const [activityFilter, setActivityFilter] = useState('ALL')
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
  }, [route, token])

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
    setSelectedSize(product.sizes[0] || 'M')
    location.hash = `#/product/${product.id}`
  }

  const parts = route.split('/').filter(Boolean)
  const bookingActivity =
    parts[0] === 'booking' ? activities.find((item) => item.id === parts[1]) : undefined
  const detailActivity =
    parts[0] === 'activity' ? activities.find((item) => item.id === parts[1]) : undefined
  const detailProduct =
    parts[0] === 'product' ? products.find((item) => item.id === parts[1]) : undefined

  // Admin route: render standalone, no site header/footer
  if (route === '/admin') {
    return (
      <>
        <FeedbackBanners
          notice={notice}
          error={error}
          catalogError={catalog.error}
          onDismissNotice={() => setNotice('')}
          onDismissError={() => setError('')}
        />
        <AdminPage
          user={user}
          token={token}
          signOut={signOut}
          setNotice={setNotice}
          setError={setError}
        />
      </>
    )
  }

  return (
    <div className="site-shell">
      <SiteHeader
        userName={user?.firstName}
        userRole={user?.role}
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
        <ActivityDetailPage activity={detailActivity} whatsappNumber={whatsappNumber} />
      )}

      {route === '/shop' && (
        <ShopPage products={products} loading={catalogLoading} onProductSelect={selectProduct} />
      )}

      {detailProduct && (
        <ProductDetailPage
          product={detailProduct}
          products={products}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          changeCart={changeCart}
          setNotice={setNotice}
          onProductSelect={selectProduct}
        />
      )}

      {route === '/cart' && (
        <CartPage
          cart={cart}
          products={products}
          cartTotal={cartTotal}
          user={user}
          changeCart={changeCart}
        />
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
        <ForgotPasswordPage busy={busy} runForm={runForm} setNotice={setNotice} />
      )}

      {route.startsWith('/reset-password') && (
        <ResetPasswordPage busy={busy} runForm={runForm} setNotice={setNotice} />
      )}

      {route.startsWith('/verify-email') && (
        <VerifyEmailPage setNotice={setNotice} setError={setError} />
      )}

      {bookingActivity && (
        <BookingPage
          bookingActivity={bookingActivity}
          user={user}
          token={token}
          paymentEnabled={paymentEnabled}
          busy={busy}
          route={route}
          runForm={runForm}
          setNotice={setNotice}
          setError={setError}
        />
      )}

      {route === '/checkout' && (
        <CheckoutPage
          cart={cart}
          cartTotal={cartTotal}
          cartCount={cartCount}
          user={user}
          token={token}
          paymentEnabled={paymentEnabled}
          busy={busy}
          runForm={runForm}
          setCart={setCart}
          setNotice={setNotice}
          setError={setError}
        />
      )}

      {route === '/account' &&
        (user && token ? (
          <AccountPage
            user={user}
            token={token}
            bookings={bookings}
            orders={orders}
            payments={payments}
            accountLoading={accountLoading}
            ticketQr={ticketQr}
            setTicketQr={setTicketQr}
            paymentEnabled={paymentEnabled}
            busy={busy}
            runForm={runForm}
            setUser={setUser}
            setBookings={setBookings}
            signOut={signOut}
            setNotice={setNotice}
            setError={setError}
          />
        ) : (
          <NotFoundPage type="unavailable" />
        ))}

      {route === '/contact' && (
        <ContactPage
          whatsappNumber={whatsappNumber}
          contactEmail={contactEmail}
          busy={busy}
          runForm={runForm}
          setNotice={setNotice}
        />
      )}

      {route === '/about' && (
        <AboutPage
          managedContent={managedContent}
          whatsappNumber={whatsappNumber}
          contactEmail={contactEmail}
          busy={busy}
          runForm={runForm}
          setNotice={setNotice}
        />
      )}

      {['faq', 'cgv', 'mentions'].includes(parts[0]) && (
        <LegalPage slug={parts[0]} managedContent={managedContent} contactEmail={contactEmail} />
      )}

      {((parts[0] === 'activity' && !detailActivity) ||
        (parts[0] === 'product' && !detailProduct) ||
        (parts[0] === 'booking' && !bookingActivity)) && <NotFoundPage type="unavailable" />}

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
        !['activity', 'product', 'booking'].includes(parts[0]) && <NotFoundPage type="not-found" />}

      <SiteFooter />

      {selectedProduct && (
        <ProductModal
          selectedProduct={selectedProduct}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          onClose={() => setSelectedProduct(null)}
          changeCart={changeCart}
          setNotice={setNotice}
        />
      )}
    </div>
  )
}

export default App
