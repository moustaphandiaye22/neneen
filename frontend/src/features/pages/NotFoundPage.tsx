import { ArrowRight, Compass, SearchX } from 'lucide-react'

interface NotFoundPageProps {
  type?: 'unavailable' | 'not-found'
}

export function NotFoundPage({ type = 'not-found' }: NotFoundPageProps) {
  if (type === 'unavailable') {
    return (
      <main className="page-content narrow-content">
        <div className="not-found-card">
          <div className="not-found-icon-wrap">
            <SearchX size={44} strokeWidth={1.5} />
          </div>
          <span className="eyebrow">neneen · indisponible</span>
          <h1>
            Cette page n'est plus disponible<span className="dot">.</span>
          </h1>
          <p>
            Le contenu recherché a été déplacé ou cette activité n'est plus ouverte à la
            réservation.
          </p>
          <div className="not-found-actions">
            <a className="button button-dark" href="#/activities">
              Voir le programme des sorties <ArrowRight size={16} />
            </a>
            <a className="button button-ghost" href="#/shop">
              Boutique neneen
            </a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page-content narrow-content">
      <div className="not-found-card">
        <div className="not-found-icon-wrap">
          <Compass size={44} strokeWidth={1.5} />
        </div>
        <span className="eyebrow">Erreur 404</span>
        <h1>
          Page introuvable<span className="dot">.</span>
        </h1>
        <p>Désolé, la page que vous cherchez n'existe pas ou a été déplacée.</p>
        <div className="not-found-actions">
          <a className="button button-dark" href="#/">
            Retour à l'accueil <ArrowRight size={16} />
          </a>
          <a className="button button-ghost" href="#/shop">
            Découvrir la boutique
          </a>
        </div>
      </div>
    </main>
  )
}
