import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'

const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')
const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || ''

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      {/* CTA band */}
      <div className="footer-cta-band">
        <div className="footer-cta-inner">
          <div>
            <span className="eyebrow" style={{ color: '#f5ab8d' }}>
              Prêt à vous lancer ?
            </span>
            <h2 className="footer-cta-title">
              Votre prochaine <em>aventure</em> commence ici.
            </h2>
          </div>
          <div className="footer-cta-actions">
            <a className="button button-light" href="#/activities">
              Voir les sorties <ArrowRight size={16} />
            </a>
            {whatsappNumber && (
              <a
                className="button footer-wa-btn"
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Bonjour ! Je voudrais en savoir plus sur neneen.')}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="footer-inner">
        <div className="footer-main">
          {/* Brand column */}
          <div className="footer-brand">
            <a className="footer-logo" href="#/" aria-label="neneen, accueil">
              <img
                src="/images/brand/logo-bordeaux.png"
                alt="neneen — Notre style, notre identité"
                width={800}
                height={566}
                loading="lazy"
              />
            </a>
            <p className="footer-tagline">Notre style, notre identité.</p>
            <div className="footer-location">
              <MapPin size={14} />
              Dakar, Sénégal
            </div>
          </div>

          {/* Nav columns */}
          <nav className="footer-links" aria-label="Explorer neneen">
            <h3>Explorer</h3>
            <a href="#/activities">Les sorties</a>
            <a href="#/calendar">Le calendrier</a>
            <a href="#/shop">La boutique</a>
            <a href="#/about">Notre histoire</a>
          </nav>

          <nav className="footer-links" aria-label="Aide et informations">
            <h3>À savoir</h3>
            <a href="#/faq">Questions fréquentes</a>
            <a href="#/cgv">Conditions de vente</a>
            <a href="#/mentions">Mentions légales</a>
            <a href="#/contact">Nous contacter</a>
          </nav>

          {/* Contact column */}
          <div className="footer-links footer-contact">
            <h3>Restons en contact</h3>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`}>
                <Mail size={14} />
                {contactEmail}
              </a>
            )}
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="footer-wa-link"
              >
                <MessageCircle size={14} />
                WhatsApp
              </a>
            )}
            <a href="#/contact">
              <Phone size={14} />
              Parlons de votre sortie
            </a>
            <div className="footer-socials">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="social-icon"
                aria-label="Instagram"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="footer-bottom">
          <span>© {year} neneen. Tous droits réservés.</span>
        </div>
      </div>
    </footer>
  )
}
