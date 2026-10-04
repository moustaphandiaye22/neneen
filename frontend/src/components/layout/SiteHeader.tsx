import { CircleUserRound, Menu, ShoppingBag, X } from 'lucide-react'

type SiteHeaderProps = {
  userName?: string
  isStaff: boolean
  cartCount: number
  menuOpen: boolean
  onMenuToggle: () => void
}

export function SiteHeader({
  userName,
  isStaff,
  cartCount,
  menuOpen,
  onMenuToggle,
}: SiteHeaderProps) {
  return (
    <>
      <div className="announcement">
        <span>Dakar, Sénégal</span>
        <span>Les rencontres changent tout.</span>
        <a href="#/activities">
          Découvrir le programme <span aria-hidden="true">→</span>
        </a>
      </div>
      <header className="site-header">
        <a className="brand-lockup" href="#/" aria-label="neneen, accueil">
          <img src="/WhatsApp%20Image%202026-10-03%20at%209.06.26%20PM.jpeg" alt="neneen" />
        </a>
        <button
          className="mobile-menu-button"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={onMenuToggle}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav
          className={menuOpen ? 'main-nav is-open' : 'main-nav'}
          aria-label="Navigation principale"
        >
          <a href="#/activities">Les sorties</a>
          <a href="#/calendar">Calendrier</a>
          <a href="#/shop">La boutique</a>
          <a href="#/about">À propos</a>
          {isStaff && <a href="#/admin">Administration</a>}
        </nav>
        <div className="header-actions">
          <a className="bag-link" href="#/cart" aria-label={`Panier, ${cartCount} articles`}>
            <ShoppingBag size={18} aria-hidden="true" />
            <span>{cartCount}</span>
          </a>
          <a className="account-link" href={userName ? '#/account' : '#/login'}>
            <CircleUserRound size={17} aria-hidden="true" />
            <span>{userName || 'Mon compte'}</span>
          </a>
        </div>
      </header>
    </>
  )
}
