import type { SyntheticEvent } from 'react'
import { useState } from 'react'
import { forgotPassword } from '../../services/authService'
import { AlertCircle, ArrowRight, KeyRound, Mail } from 'lucide-react'

interface ForgotPasswordPageProps {
  busy: boolean
  runForm: (
    event: SyntheticEvent<HTMLFormElement>,
    action: (data: FormData) => Promise<void>,
  ) => Promise<void>
  setNotice: (notice: string) => void
}

export function ForgotPasswordPage({ busy, runForm, setNotice }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  const handleValidation = (e: SyntheticEvent<HTMLFormElement>) => {
    setEmailError('')
    if (!email.trim()) {
      e.preventDefault()
      setEmailError('Veuillez saisir votre adresse e-mail.')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      e.preventDefault()
      setEmailError('Adresse e-mail invalide. Exemple attendu : nom@exemple.com.')
      return
    }
    void runForm(e, async (data) => {
      const result = await forgotPassword({ email: String(data.get('email')) })
      setNotice(result.message)
    })
  }

  return (
    <main className="page-content auth-layout-container">
      <div className="auth-card-panel">
        <div className="auth-panel-header">
          <div className="auth-icon-badge">
            <KeyRound size={32} strokeWidth={1.5} />
          </div>
          <span className="eyebrow">Récupération de compte</span>
          <h1>
            Mot de passe oublié<span className="dot">.</span>
          </h1>
          <p>
            Saisissez votre adresse e-mail ci-dessous pour recevoir un lien de réinitialisation
            sécurisé.
          </p>
        </div>

        <form className="auth-form" noValidate onSubmit={handleValidation}>
          <label className="form-label">
            <span>
              <Mail size={14} /> Adresse e-mail
            </span>
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError('')
              }}
              placeholder="votre.email@exemple.com"
              aria-invalid={Boolean(emailError)}
            />
            {emailError && (
              <span className="field-error" role="alert">
                <AlertCircle size={13} /> {emailError}
              </span>
            )}
          </label>

          <button
            className="button button-dark full-button"
            disabled={busy}
            style={{ marginTop: '12px' }}
          >
            {busy ? 'Envoi en cours…' : 'Recevoir le lien de réinitialisation'}{' '}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '20px', textAlign: 'center' }}>
          <a className="auth-secondary-link" href="#/login">
            ← Retour à la page de connexion
          </a>
        </div>
      </div>
    </main>
  )
}
