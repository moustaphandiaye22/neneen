import {
  ChevronDown,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'

type SiteHeaderProps = {
  userName?: string
  userRole?: string
  cartCount: number
  menuOpen: boolean
  onMenuToggle: () => void
  onSignOut: () => void
}

export function SiteHeader({
  userName,
  userRole,
  cartCount,
  menuOpen,
  onMenuToggle,
  onSignOut,
}: SiteHeaderProps) {
  const isAdmin = userRole && ['ADMIN', 'STAFF'].includes(userRole)

  return (
    <>
      {/* Main Header */}
      <header className="site-header">
        {/* Brand */}
        <a className="brand-lockup" href="#/" aria-label="neneen, accueil">
          <img src="/images/brand/logo.png" alt="neneen" width={800} height={566} />
        </a>

        {/* Mobile & Desktop nav drawer */}
        <nav className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Navigation principale">
          <a href="#/activities" onClick={() => menuOpen && onMenuToggle()}>
            Les sorties
          </a>
          <a href="#/calendar" onClick={() => menuOpen && onMenuToggle()}>
            Calendrier
          </a>
          <a href="#/shop" onClick={() => menuOpen && onMenuToggle()}>
            La boutique
          </a>
          <a href="#/about" onClick={() => menuOpen && onMenuToggle()}>
            À propos
          </a>
          {isAdmin && (
            <a href="#/admin" className="nav-admin-link" onClick={() => menuOpen && onMenuToggle()}>
              <LayoutDashboard size={14} />
              Admin
            </a>
          )}

          {/* User Account Section in Mobile Drawer */}
          <div className="mobile-nav-account">
            {userName ? (
              <div className="mobile-account-card">
                <div className="mobile-account-header">
                  <div className="profile-avatar">{userName.charAt(0).toUpperCase()}</div>
                  <div className="mobile-account-info">
                    <strong>{userName}</strong>
                    <span className="profile-role">
                      {userRole === 'ADMIN'
                        ? 'Administrateur'
                        : userRole === 'STAFF'
                          ? 'Équipe'
                          : 'Membre'}
                    </span>
                  </div>
                </div>
                <div className="mobile-account-actions">
                  <a
                    href="#/account"
                    className="mobile-account-item"
                    onClick={() => menuOpen && onMenuToggle()}
                  >
                    <User size={16} />
                    Mon espace
                  </a>
                  {isAdmin && (
                    <a
                      href="#/admin"
                      className="mobile-account-item"
                      onClick={() => menuOpen && onMenuToggle()}
                    >
                      <LayoutDashboard size={16} />
                      Administration
                    </a>
                  )}
                  <button
                    type="button"
                    className="mobile-account-signout"
                    onClick={() => {
                      onSignOut()
                      if (menuOpen) onMenuToggle()
                    }}
                  >
                    <LogOut size={16} />
                    Se déconnecter
                  </button>
                </div>
              </div>
            ) : (
              <a
                href="#/login"
                className="mobile-login-btn"
                onClick={() => menuOpen && onMenuToggle()}
              >
                <CircleUserRound size={18} />
                <span>Se connecter / S'inscrire</span>
              </a>
            )}
          </div>
        </nav>

        {/* Header Actions (Right side: Cart Bag + Mobile Menu Hamburger) */}
        <div className="header-actions">
          {/* Cart */}
          <a
            className="bag-link"
            href="#/cart"
            aria-label={`Panier, ${cartCount} article${cartCount > 1 ? 's' : ''}`}
          >
            <ShoppingBag size={18} aria-hidden="true" />
            {cartCount > 0 && <span>{cartCount}</span>}
          </a>

          {/* Mobile menu toggle button (placed beside Panier on mobile) */}
          <button
            className="mobile-menu-button"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            onClick={onMenuToggle}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop Profile Dropdown */}
          {userName ? (
            <details className="profile-menu desktop-only-account">
              <summary className="account-link profile-trigger">
                <div className="profile-avatar">{userName.charAt(0).toUpperCase()}</div>
                <span className="profile-name">{userName}</span>
                <ChevronDown size={14} className="profile-chevron" aria-hidden="true" />
              </summary>
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <strong>{userName}</strong>
                  <span className="profile-role">
                    {userRole === 'ADMIN'
                      ? 'Administrateur'
                      : userRole === 'STAFF'
                        ? 'Équipe'
                        : 'Membre'}
                  </span>
                </div>
                <div className="profile-dropdown-items">
                  <a href="#/account" className="profile-dropdown-item">
                    <User size={15} />
                    Mon espace
                  </a>
                  {isAdmin && (
                    <a href="#/admin" className="profile-dropdown-item">
                      <LayoutDashboard size={15} />
                      Administration
                    </a>
                  )}
                </div>
                <div className="profile-dropdown-footer">
                  <button type="button" className="profile-signout" onClick={onSignOut}>
                    <LogOut size={15} />
                    Se déconnecter
                  </button>
                </div>
              </div>
            </details>
          ) : (
            <a className="account-link btn-login desktop-only-account" href="#/login">
              <CircleUserRound size={17} aria-hidden="true" />
              <span>Se connecter</span>
            </a>
          )}
        </div>
      </header>

      {/* Mobile backdrop */}
      {menuOpen && <div className="mobile-backdrop" onClick={onMenuToggle} aria-hidden="true" />}
    </>
  )
}
