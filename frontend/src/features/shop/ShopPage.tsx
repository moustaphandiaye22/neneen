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
      <section className="brand-details" aria-labelledby="brand-details-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">L’univers neneen</span>
            <h2 id="brand-details-title">Notre identité, jusque dans les détails.</h2>
          </div>
        </div>
        <div className="brand-details-grid">
          <figure>
            <img
              src="/images/brand/etiquettes.jpg"
              alt="Étiquettes neneen blanches et bordeaux avec cordons"
              width={1000}
              height={800}
              loading="lazy"
            />
            <figcaption>La signature neneen</figcaption>
          </figure>
          <figure>
            <img
              src="/images/brand/ruban.jpg"
              alt="Ruban d’emballage aux couleurs et au logo neneen"
              width={1000}
              height={1000}
              loading="lazy"
            />
            <figcaption>Les couleurs de notre marque</figcaption>
          </figure>
        </div>
      </section>
    </main>
  )
}
