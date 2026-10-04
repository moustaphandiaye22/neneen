import type { SyntheticEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { envoyerMessage } from '../../services/contactService'

interface ContactPageProps {
  whatsappNumber: string
  contactEmail: string
  busy: boolean
  runForm: (
    event: SyntheticEvent<HTMLFormElement>,
    action: (data: FormData) => Promise<void>,
  ) => Promise<void>
  setNotice: (notice: string) => void
}

export function ContactPage({
  whatsappNumber,
  contactEmail,
  busy,
  runForm,
  setNotice,
}: ContactPageProps) {
  return (
    <main className="page-content contact-layout">
      <div>
        <span className="eyebrow">Une question, une idée ?</span>
        <h1>
          On vous <em>écoute.</em>
        </h1>
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
    </main>
  )
}
