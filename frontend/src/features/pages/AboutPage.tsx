import type { SyntheticEvent } from 'react'
import { ArrowRight, CreditCard, MapPin, ShoppingCart, Target } from 'lucide-react'
import { envoyerMessage } from '../../services/contactService'

interface AboutPageProps {
  managedContent: { title: string; body: string } | null
  whatsappNumber: string
  contactEmail: string
  busy: boolean
  runForm: (
    event: SyntheticEvent<HTMLFormElement>,
    action: (data: FormData) => Promise<void>,
  ) => Promise<void>
  setNotice: (notice: string) => void
}

export function AboutPage({
  managedContent,
  whatsappNumber,
  contactEmail,
  busy,
  runForm,
  setNotice,
}: AboutPageProps) {
  return (
    <main className="page-content about-page">
      <div className="page-intro">
        <span className="eyebrow">Notre style, notre identité</span>
        <h1>
          À propos de <em>neneen.</em>
        </h1>
        <p>Une invitation à sortir, se rencontrer et faire communauté.</p>
      </div>
      <div className="about-feature">
        <img
          className="about-brand-photo"
          src="/images/brand/sacs.jpg"
          alt="Sacs neneen blancs et bordeaux portant le logo de la marque"
          width={1200}
          height={960}
        />
        <div>
          <span className="eyebrow">Notre mission</span>
          <h2>Rendre les rencontres simples.</h2>
          <p>
            {managedContent?.body ||
              'neneen imagine des sorties, des afterworks et des événements accessibles, bien encadrés et ouverts à toutes celles et ceux qui ont envie de partager un bon moment.'}
          </p>
          <p>
            Depuis Dakar, nous créons des occasions de découvrir autrement nos lieux, nos histoires
            et les personnes qui font notre quotidien.
          </p>
          <a className="button button-dark" href="#/activities">
            Venez comme vous êtes <ArrowRight size={15} />
          </a>
        </div>
      </div>

      {/* Informations de l'application */}
      <div className="about-info-section">
        <span className="eyebrow">L'application</span>
        <h2>neneen en quelques chiffres</h2>
        <div className="about-info-grid">
          <div className="about-info-card">
            <span className="about-info-icon">
              <MapPin size={22} />
            </span>
            <strong>Localisation</strong>
            <p>Dakar, Sénégal</p>
          </div>
          <div className="about-info-card">
            <span className="about-info-icon">
              <Target size={22} />
            </span>
            <strong>Notre objectif</strong>
            <p>Faciliter les rencontres et créer du lien social</p>
          </div>
          <div className="about-info-card">
            <span className="about-info-icon">
              <ShoppingCart size={22} />
            </span>
            <strong>Services</strong>
            <p>Activités, boutique, réservations en ligne</p>
          </div>
          <div className="about-info-card">
            <span className="about-info-icon">
              <CreditCard size={22} />
            </span>
            <strong>Paiements</strong>
            <p>Wave, Orange Money, carte bancaire, espèces</p>
          </div>
        </div>
      </div>

      {/* Formulaire de contact */}
      <div className="about-contact-section">
        <div className="about-contact-info">
          <span className="eyebrow">Une question, une idée ?</span>
          <h2>
            On vous <em>écoute.</em>
          </h2>
          <p>Notre équipe est à Dakar et vous répond au plus vite.</p>
          {whatsappNumber && (
            <a className="contact-detail" href={`https://wa.me/${whatsappNumber}`}>
              <span>WhatsApp</span>+{whatsappNumber} <ArrowRight size={16} />
            </a>
          )}
          {contactEmail && (
            <a className="contact-detail" href={`mailto:${contactEmail}`}>
              <span>E-mail</span>
              {contactEmail} <ArrowRight size={16} />
            </a>
          )}
        </div>
        <form
          className="checkout-form"
          noValidate
          onSubmit={(event) => {
            const form = event.currentTarget
            return runForm(event, async (data) => {
              await envoyerMessage(Object.fromEntries(data.entries()))
              setNotice('Votre message a bien été envoyé.')
              form.reset()
            })
          }}
        >
          <label className="form-label">
            Votre nom
            <input name="name" required />
          </label>
          <label className="form-label">
            Votre e-mail
            <input name="email" type="email" required />
          </label>
          <label className="form-label">
            Votre message
            <textarea name="message" required minLength={10} rows={5} />
          </label>
          <button className="button button-dark" disabled={busy}>
            Envoyer le message <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </main>
  )
}
