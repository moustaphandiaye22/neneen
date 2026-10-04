import { ArrowRight, Plus } from 'lucide-react'
import type { Product } from '../../types'
import { money } from '../../lib/presentation'

export function ProductCard({
  product,
  onSelect,
}: {
  product: Product
  onSelect: (product: Product) => void
}) {
  return (
    <article className="product-card" key={product.id}>
      <button
        className={`product-image tone-${product.color.toLowerCase().replace(/[^a-z]/g, '')}`}
        onClick={() => onSelect(product)}
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
