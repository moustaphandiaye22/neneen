import type { CartLine, Product, User } from '../../types'
import { money } from '../../lib/presentation'
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2 } from 'lucide-react'

interface CartPageProps {
  cart: CartLine[]
  products: Product[]
  cartTotal: number
  user: User | null
  changeCart: (product: Product, size: string, delta: number) => void
}

export function CartPage({ cart, products, cartTotal, user, changeCart }: CartPageProps) {
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0)

  return (
    <main className="page-content cart-page-container">
      <div className="page-intro" style={{ textAlign: 'left', margin: '0 0 32px' }}>
        <span className="eyebrow">Votre Commande</span>
        <h1>
          Mon panier<span className="dot">.</span>
        </h1>
        {cart.length > 0 && (
          <p className="cart-count-label">
            {itemCount} article{itemCount > 1 ? 's' : ''} sélectionné{itemCount > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {cart.length > 0 ? (
        <div className="cart-layout-grid">
          <div className="cart-list">
            {cart.map((line) => {
              const product = products.find((p) => p.id === line.productId)
              return (
                <article className="cart-row" key={`${line.productId}-${line.size}`}>
                  <div
                    className={`cart-swatch tone-${line.color?.toLowerCase().replace(/[^a-z]/g, '') || 'marine'}`}
                    style={
                      product?.imageUrl
                        ? { backgroundImage: `url(${product.imageUrl})` }
                        : undefined
                    }
                  >
                    {!product?.imageUrl && <span>n.</span>}
                  </div>

                  <div className="cart-product">
                    <strong>{line.name}</strong>
                    <span className="cart-product-meta">
                      {line.color} · Taille <strong>{line.size}</strong>
                    </span>
                    <span className="cart-product-unit-price">{money(line.price)} / unité</span>
                  </div>

                  <div className="quantity-control">
                    <button
                      onClick={() => {
                        if (product) changeCart(product, line.size, -1)
                      }}
                      aria-label="Diminuer"
                    >
                      {line.quantity === 1 ? (
                        <Trash2 size={13} className="text-danger" />
                      ) : (
                        <Minus size={13} />
                      )}
                    </button>
                    <span>{line.quantity}</span>
                    <button
                      onClick={() => {
                        if (product) changeCart(product, line.size, 1)
                      }}
                      aria-label="Augmenter"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <strong className="cart-line-price">{money(line.price * line.quantity)}</strong>
                </article>
              )
            })}
          </div>

          <aside className="cart-summary-card">
            <h3 className="cart-summary-title">Récapitulatif</h3>
            <div className="cart-summary-row">
              <span>
                Sous-total ({itemCount} article{itemCount > 1 ? 's' : ''})
              </span>
              <strong>{money(cartTotal)}</strong>
            </div>
            <div className="cart-total-divider" />
            <div className="cart-summary-row cart-total-row">
              <span>Total</span>
              <strong className="cart-total-amount">{money(cartTotal)}</strong>
            </div>

            <a
              className="button button-dark full-button checkout-btn"
              href={user ? '#/checkout' : '#/login'}
              onClick={() => {
                if (!user) sessionStorage.setItem('neneen_after_login', '/checkout')
              }}
            >
              Commander maintenant <ArrowRight size={16} />
            </a>

            <div className="cart-guarantees">
              <span>
                <ShieldCheck size={14} /> Paiement Wave et Orange Money
              </span>
            </div>

            <a className="cart-continue-link" href="#/shop">
              ← Continuer vos achats
            </a>
          </aside>
        </div>
      ) : (
        <div className="cart-empty-state">
          <div className="cart-empty-icon">
            <ShoppingBag size={48} strokeWidth={1.5} />
          </div>
          <h2>Votre panier est actuellement vide</h2>
          <p>
            Explorez notre boutique pour découvrir les dernières pièces de la collection neneen.
          </p>
          <a className="button button-dark" href="#/shop">
            Découvrir la collection <ArrowRight size={16} />
          </a>
        </div>
      )}
    </main>
  )
}
