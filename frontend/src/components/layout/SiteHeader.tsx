import { ChevronDown, CircleUserRound, Menu, ShoppingBag, X } from 'lucide-react'

type SiteHeaderProps = {
  userName?: string
  cartCount: number
  menuOpen: boolean
  onMenuToggle: () => void
  onSignOut: () => void
}

export function SiteHeader({
  userName,
  cartCount,
  menuOpen,
  onMenuToggle,
  onSignOut,
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
        </nav>
        <div className="header-actions">
          <a className="bag-link" href="#/cart" aria-label={`Panier, ${cartCount} articles`}>
            <ShoppingBag size={18} aria-hidden="true" />
            <span>{cartCount}</span>
          </a>
          {userName ? (
            <details className="profile-menu">
              <summary className="account-link">
                <CircleUserRound size={17} aria-hidden="true" />
                <span>{userName}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </summary>
              <div className="profile-dropdown">
                <a href="#/account">Mon espace</a>
                <button type="button" onClick={onSignOut}>
                  Se déconnecter
                </button>
              </div>
            </details>
          ) : (
            <a className="account-link" href="#/login">
              <CircleUserRound size={17} aria-hidden="true" />
              <span>Mon compte</span>
            </a>
          )}
        </div>
      </header>
    </>
  )
}
