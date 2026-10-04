import type { Product } from '../../types'
import { money } from '../../lib/presentation'
import { stockForSize } from './stock'
import { collectionDetailImage, usesCollectionImage } from '../../lib/productImages'
import { ProductCard } from './ProductCard'
import { MessageCircle, ShieldCheck, ShoppingBag } from 'lucide-react'

interface ProductDetailPageProps {
  product: Product
  products: Product[]
  selectedSize: string
  setSelectedSize: (size: string) => void
  changeCart: (product: Product, size: string, delta: number) => void
  setNotice: (notice: string) => void
  onProductSelect: (product: Product) => void
}

const rawWa = import.meta.env.VITE_WHATSAPP_NUMBER || ''
const whatsappNumber = rawWa.replace(/\D/g, '') || '221770000000'

export function ProductDetailPage({
  product,
  products,
  selectedSize,
  setSelectedSize,
  changeCart,
  setNotice,
  onProductSelect,
}: ProductDetailPageProps) {
  const currentSize = product.sizes.includes(selectedSize) ? selectedSize : product.sizes[0] || 'M'

  const inStock = stockForSize(product, currentSize) > 0

  const whatsappMessage = encodeURIComponent(
    `Bonjour neneen, je souhaite avoir des informations / commander : ${product.name} (${product.color}, taille ${currentSize}, ${money(product.price)}).`,
  )
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
    : '#'

  return (
    <main className="page-content product-detail-page">
      <a className="back-link" href="#/shop">
        ← Retour à la boutique
      </a>
      <div className="product-detail-layout">
        <div className="product-gallery">
          <div
            className={`product-detail-image tone-${product.color.toLowerCase().replace(/[^a-z]/g, '')}`}
            style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}
          >
            {!product.imageUrl && <span className="product-mark">n.</span>}
            <span className="eyebrow">Collection Build Different</span>
          </div>
          {usesCollectionImage(product) && (
            <figure className="product-gallery-detail">
              <img
                src={collectionDetailImage}
                alt="Détail du T-shirt blanc Build Different plié, avec son étiquette neneen"
                loading="lazy"
                width={1500}
                height={1192}
              />
              <figcaption>Détails du motif et de l’étiquette neneen</figcaption>
            </figure>
          )}
        </div>
        <section className="product-detail-copy">
          <span className="eyebrow">neneen · {product.color}</span>
          <h1>{product.name}</h1>
          <strong className="large-price">{money(product.price)}</strong>
          <p>{product.description}</p>
          {usesCollectionImage(product) && product.color.toLowerCase() !== 'blanc' && (
            <p className="muted">
              Visuel de la collection en blanc. Coloris sélectionné : {product.color}.
            </p>
          )}

          <div className="stock-status-tag">
            <span className={`status-dot ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`} />
            <span>{product.stock > 0 ? `${product.stock} pièce(s) disponible(s)` : 'Épuisé'}</span>
          </div>

          <div className="size-selector-group">
            <label className="form-label">
              <span>Taille</span>
              <select value={currentSize} onChange={(event) => setSelectedSize(event.target.value)}>
                {product.sizes.map((size) => (
                  <option value={size} key={size} disabled={stockForSize(product, size) === 0}>
                    {size} {stockForSize(product, size) === 0 ? '— épuisé' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="detail-actions-stack">
            <button
              className="button button-dark full-button"
              disabled={!inStock}
              onClick={() => {
                changeCart(product, currentSize, 1)
                setNotice('Article ajouté à votre panier.')
              }}
            >
              {inStock ? 'Ajouter au panier' : 'Rupture de stock'} <ShoppingBag size={16} />
            </button>

            {whatsappNumber && (
              <a
                className="button button-whatsapp full-button"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Commander / Info via WhatsApp <MessageCircle size={16} />
              </a>
            )}
          </div>

          <div className="product-assurance">
            <div>
              <ShieldCheck size={14} /> <span>Paiement Wave et Orange Money</span>
            </div>
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
            .filter((p) => p.id !== product.id)
            .slice(0, 3)
            .map((p) => (
              <ProductCard product={p} key={p.id} onSelect={onProductSelect} />
            ))}
        </div>
      </section>
    </main>
  )
}
