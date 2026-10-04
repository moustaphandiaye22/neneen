import { useState } from 'react'
import type { SyntheticEvent } from 'react'
import type { CartLine, User } from '../../types'
import { money } from '../../lib/presentation'
import { ArrowRight, Lock, ShieldCheck, CheckCircle2, ShoppingBag } from 'lucide-react'
import { passerCommande } from '../../services/shopService'
import { initiatePayment } from '../../services/paymentService'

interface CheckoutPageProps {
  cart: CartLine[]
  cartTotal: number
  cartCount: number
  user: User | null
  token: string | null
  paymentEnabled: boolean
  busy: boolean
  runForm: (
    event: SyntheticEvent<HTMLFormElement>,
    action: (data: FormData) => Promise<void>,
  ) => Promise<void>
  setCart: (cart: CartLine[]) => void
  setNotice: (notice: string) => void
  setError: (error: string) => void
}

export function CheckoutPage({
  cart,
  cartTotal,
  cartCount,
  user,
  token,
  paymentEnabled,
  busy,
  runForm,
  setCart,
  setNotice,
}: CheckoutPageProps) {
  const [selectedPayment, setSelectedPayment] = useState<'WAVE' | 'ORANGE_MONEY'>('WAVE')

  if (!user) {
    return (
      <main className="page-content checkout-page-container">
        <div className="checkout-gate">
          <div className="checkout-gate-icon">
            <Lock size={40} strokeWidth={1.5} />
          </div>
          <span className="eyebrow">Espace membre</span>
          <h2>Connectez-vous pour finaliser votre commande</h2>
          <p>
            Votre panier est conservé en toute sécurité. Connectez-vous pour valider votre commande.
          </p>
          <a
            className="button button-dark"
            href="#/login"
            onClick={() => sessionStorage.setItem('neneen_after_login', '/checkout')}
          >
            Se connecter <ArrowRight size={16} />
          </a>
        </div>
      </main>
    )
  }

  const grandTotal = cartTotal

  return (
    <main className="page-content checkout-page-container">
      <div className="checkout-page-header">
        <a className="back-link" href="#/cart">
          ← Retour au panier
        </a>
        <div className="page-intro" style={{ textAlign: 'left', margin: '16px 0 32px' }}>
          <span className="eyebrow">Finaliser votre commande</span>
          <h1>
            Votre paiement<span className="dot">.</span>
          </h1>
          <p>Choisissez votre moyen de paiement et confirmez votre commande.</p>
        </div>
      </div>

      <div className="checkout-layout-grid">
        {/* Form area */}
        <form
          className="checkout-form"
          noValidate
          onSubmit={(event) => {
            void runForm(event, async () => {
              if (!paymentEnabled)
                throw new Error('Les paiements en ligne sont temporairement indisponibles.')
              if (cart.length === 0) throw new Error('Votre panier est vide.')
              if (!token) throw new Error('Reconnectez-vous pour confirmer votre commande.')
              const result = await passerCommande(
                {
                  shippingAddress: 'Retrait à convenir avec neneen',
                  paymentMethod: selectedPayment,
                  shippingFee: 0,
                  items: cart.map(({ productId, size, quantity }) => ({
                    productId,
                    size,
                    quantity,
                  })),
                },
                token,
              )
              setCart([])
              {
                try {
                  const payment = await initiatePayment(token, {
                    orderId: result.order.id,
                    method: selectedPayment,
                    idempotencyKey: crypto.randomUUID(),
                  })
                  if (payment.checkoutUrl) {
                    location.href = payment.checkoutUrl
                    return
                  }
                } catch (err) {
                  console.warn('Initiate payment gateway exception:', err)
                  setNotice(
                    `Commande ${result.order.id} enregistrée. Paiement non finalisé : réessayez depuis votre espace client.`,
                  )
                  location.hash = '/account'
                  return
                }
              }
              setNotice(`${result.message} Référence : ${result.order.id}.`)
              location.hash = '/account'
            })
          }}
        >
          <fieldset className="checkout-payment-options" disabled={!paymentEnabled || busy}>
            <legend>Comment souhaitez-vous payer ?</legend>
            <p className="muted">Sélectionnez votre service de paiement mobile.</p>
            <div className="checkout-wallet-list">
              {(
                [
                  {
                    method: 'WAVE',
                    name: 'Wave',
                    logo: 'wave.png',
                    description: 'Continuez avec votre compte Wave.',
                  },
                  {
                    method: 'ORANGE_MONEY',
                    name: 'Orange Money',
                    logo: 'orange-money.png',
                    description: 'Continuez avec votre compte Orange Money.',
                  },
                ] as const
              ).map(({ method, name, logo, description }) => (
                <label
                  key={method}
                  className={`checkout-wallet ${selectedPayment === method ? 'is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={selectedPayment === method}
                    onChange={() => setSelectedPayment(method)}
                  />
                  <img src={`/images/payments/${logo}`} alt="" width={72} height={72} />
                  <span className="checkout-wallet-copy">
                    <strong>{name}</strong>
                    <span>{description}</span>
                  </span>
                  {selectedPayment === method && (
                    <CheckCircle2 className="checkout-wallet-check" size={22} aria-hidden="true" />
                  )}
                </label>
              ))}
            </div>
          </fieldset>
          {!paymentEnabled ? (
            <p className="payment-note-box" role="status">
              Les paiements en ligne sont temporairement indisponibles. Votre panier est conservé.
            </p>
          ) : (
            <div className="payment-note-box">
              <ShieldCheck size={20} />
              <span>Vous serez redirigé vers le service choisi pour autoriser votre paiement.</span>
            </div>
          )}

          <button
            className="button button-dark full-button submit-order-btn"
            disabled={busy || !paymentEnabled || cart.length === 0}
          >
            {busy ? 'Traitement en cours…' : `Confirmer et payer (${money(grandTotal)})`}{' '}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Order summary sidebar */}
        <aside className="checkout-summary-sidebar">
          <div className="summary-sidebar-header">
            <ShoppingBag size={20} className="summary-icon" />
            <h3 className="checkout-summary-heading">Récapitulatif commande</h3>
          </div>

          <div className="checkout-items-mini">
            {cart.map((line) => (
              <div className="checkout-mini-row" key={`${line.productId}-${line.size}`}>
                <div className="checkout-mini-info">
                  <strong>{line.name}</strong>
                  <span>
                    Taille {line.size} × {line.quantity}
                  </span>
                </div>
                <strong>{money(line.price * line.quantity)}</strong>
              </div>
            ))}
          </div>

          <div className="checkout-breakdown">
            <div className="checkout-line">
              <span>
                Sous-total ({cartCount} article{cartCount > 1 ? 's' : ''})
              </span>
              <strong>{money(cartTotal)}</strong>
            </div>
            <div className="cart-total-divider" />
            <div className="checkout-line checkout-grand-total">
              <span>Total général</span>
              <strong className="total-amount">{money(grandTotal)}</strong>
            </div>
          </div>

          <div className="checkout-trust-box">
            <div>
              <ShieldCheck size={14} /> <span>Paiement sécurisé et chiffré SSL</span>
            </div>
            <div>
              <Lock size={14} /> <span>Protection stricte des données de paiement</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
