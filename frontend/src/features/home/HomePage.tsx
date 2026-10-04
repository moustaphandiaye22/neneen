import { ArrowDownRight, ArrowRight } from 'lucide-react'
import type { Activity, Product } from '../../types'
import { ActivityCard } from '../activities/ActivityCard'
import { ProductCard } from '../shop/ProductCard'

type HomePageProps = {
  activities: Activity[]
  products: Product[]
  loading: boolean
  onProductSelect: (product: Product) => void
}

export function HomePage({
  activities,
  products,
  loading: catalogLoading,
  onProductSelect,
}: HomePageProps) {
  return (
    <main>
      <section className="hero-section">
        <div className="hero-image" />
        <div className="hero-content">
          <span className="eyebrow light">Dakar · Sénégal · Ensemble</span>
          <h1>
            La vie est plus belle <em>à plusieurs.</em>
          </h1>
          <p>
            Des sorties qui rapprochent, des histoires qui restent. Trouvez votre prochain
            rendez-vous avec neneen.
          </p>
          <div className="hero-actions">
            <a className="button button-light" href="#/activities">
              Trouver une sortie <ArrowRight size={17} />
            </a>
            <a className="hero-text-link" href="#/shop">
              Voir la collection
            </a>
          </div>
        </div>
        <span className="hero-index">
          01 <i /> 03
        </span>
        <a href="#upcoming" className="hero-scroll">
          Défiler <ArrowDownRight size={16} />
        </a>
      </section>
      <section className="intro-strip">
        <span className="eyebrow">Notre promesse</span>
        <p>
          Des expériences pensées avec soin, au rythme de Dakar, pour faire de nouvelles rencontres.
        </p>
        <a href="#/contact">
          En savoir plus <ArrowRight size={15} />
        </a>
      </section>
      <section className="content-section" id="upcoming">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Le prochain rendez-vous</span>
            <h2>
              À vivre bientôt<span className="dot">.</span>
            </h2>
          </div>
          <a className="text-action" href="#/activities">
            Tout le programme <ArrowRight size={16} />
          </a>
        </div>
        {catalogLoading ? (
          <div className="loading-state" role="status">
            Les prochaines sorties arrivent…
          </div>
        ) : (
          <div className="activity-grid">
            {[...activities]
              .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
              .slice(0, 3)
              .map((activity, index) => (
                <ActivityCard activity={activity} index={index} key={activity.id} />
              ))}
          </div>
        )}
        {activities.length === 0 && (
          <div className="empty-state">Les prochaines sorties arrivent bientôt.</div>
        )}
      </section>
      <section className="editorial-section">
        <div className="editorial-copy">
          <span className="eyebrow">Se rencontrer autrement</span>
          <h2>
            Un agenda ouvert.
            <br />
            <em>Des liens bien réels.</em>
          </h2>
          <p>
            Une excursion au grand air, un afterwork sans pression ou une belle soirée à célébrer.
            Choisissez l’ambiance, on s’occupe du reste.
          </p>
          <a className="button button-dark" href="#/activities">
            Explorer les sorties <ArrowRight size={17} />
          </a>
        </div>
        <div className="editorial-photo" />
      </section>
      <section className="content-section shop-preview">
        <div className="section-heading">
          <div>
            <span className="eyebrow">À porter au quotidien</span>
            <h2>
              La collection neneen<span className="dot">.</span>
            </h2>
          </div>
          <a className="text-action" href="#/shop">
            Toute la boutique <ArrowRight size={16} />
          </a>
        </div>
        <div className="product-grid">
          {products.slice(0, 3).map((product) => (
            <ProductCard product={product} key={product.id} onSelect={onProductSelect} />
          ))}
        </div>
      </section>
    </main>
  )
}
