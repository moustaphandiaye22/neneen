import { ArrowRight, MessageCircle, Plus, Users } from 'lucide-react'
import type { Product } from '../../types'
import { money } from '../../lib/presentation'

const rawWa = import.meta.env.VITE_WHATSAPP_NUMBER || ''
const whatsappNumber = rawWa.replace(/\D/g, '') || '221770000000'

export function ProductCard({
  product,
  onSelect,
}: {
  product: Product
  onSelect: (product: Product) => void
}) {
  const waText = encodeURIComponent(
    `Bonjour ! Je suis intéressé(e) par le produit : ${product.name} (${product.color}).`,
  )
  const waHref = `https://wa.me/${whatsappNumber}?text=${waText}`

  return (
    <article className="product-card">
      {/* Image / swatch */}
      <button
        className={`product-image tone-${product.color.toLowerCase().replace(/[^a-z]/g, '')}`}
        onClick={() => onSelect(product)}
        style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : undefined}
        aria-label={`Choisir ${product.name} ${product.color}`}
      >
        {!product.imageUrl && <span className="product-mark">n.</span>}
        <span className="product-add" aria-hidden="true">
          <Plus size={18} />
        </span>

        {/* Stock badge */}
        {product.stock <= 5 && product.stock > 0 && (
          <span className="product-stock-badge">
            <Users size={11} /> {product.stock} restant{product.stock > 1 ? 's' : ''}
          </span>
        )}
        {product.stock === 0 && (
          <span className="product-stock-badge product-stock-out">Épuisé</span>
        )}
      </button>

      {/* Info section */}
      <div className="product-info-wrap">
        <div
          className="product-info"
          onClick={() => onSelect(product)}
          style={{ cursor: 'pointer' }}
        >
          <div>
            <span className="eyebrow">Build Different</span>
            <h3>{product.name}</h3>
            <span className="muted">{product.color}</span>
          </div>
          <strong className="product-price">{money(product.price)}</strong>
        </div>

        {/* Actions row */}
        <div className="product-card-actions">
          <a className="text-action product-details-link" href={`#/product/${product.id}`}>
            Voir la fiche <ArrowRight size={13} />
          </a>
          {waHref && (
            <a
              className="product-wa-btn"
              href={waHref}
              target="_blank"
              rel="noreferrer"
              aria-label={`Demander via WhatsApp pour ${product.name}`}
              title="Demander sur WhatsApp"
            >
              <MessageCircle size={15} />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
