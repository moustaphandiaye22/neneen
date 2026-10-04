import type { Product } from '../../types'
import { ProductCard } from './ProductCard'

type ShopPageProps = {
  products: Product[]
  loading: boolean
  onProductSelect: (product: Product) => void
}

export function ShopPage({ products, loading: catalogLoading, onProductSelect }: ShopPageProps) {
  return (
    <main className="page-content">
      <div className="page-intro">
        <span className="eyebrow">La collection neneen</span>
        <h1>
          Build <em>Different.</em>
        </h1>
        <p>Des essentiels avec un état d’esprit : construire ce qui nous ressemble.</p>
      </div>
      {catalogLoading ? (
        <div className="loading-state" role="status">
          Chargement de la collection…
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard product={product} key={product.id} onSelect={onProductSelect} />
          ))}
        </div>
      )}
      {products.length === 0 && <div className="empty-state">La collection revient bientôt.</div>}
    </main>
  )
}
