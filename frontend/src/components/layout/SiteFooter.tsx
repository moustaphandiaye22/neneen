import { ArrowUpRight, Mail, MapPin, MessageCircle } from 'lucide-react'

const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '')
const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || ''

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="footer-logo" href="#/" aria-label="neneen, accueil">
              <img src="/WhatsApp%20Image%202026-10-03%20at%209.06.26%20PM.jpeg" alt="neneen" />
            </a>
            <p>Notre style, notre identité.</p>
            <span className="footer-location">
              <MapPin size={15} aria-hidden="true" /> Dakar, Sénégal
            </span>
          </div>
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
          <div className="footer-links footer-contact">
            <h3>Restons en contact</h3>
            {contactEmail && (
              <a href={`mailto:${contactEmail}`}>
                <Mail size={15} aria-hidden="true" /> {contactEmail}
              </a>
            )}
            {whatsappNumber && (
              <a href={`https://wa.me/${whatsappNumber}`}>
                <ArrowUpRight size={15} aria-hidden="true" /> Écrivez-nous sur WhatsApp
              </a>
            )}
            <a href="#/contact">
              <MessageCircle size={15} aria-hidden="true" /> Parlons de votre prochaine sortie
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} neneen. Tous droits réservés.</span>
          <span>Fait pour se retrouver à Dakar.</span>
        </div>
      </div>
    </footer>
  )
}
