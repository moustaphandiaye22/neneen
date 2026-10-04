import { AccountForms } from './AccountForms'
import type { AuthResult } from '../../types'
import { CircleUserRound } from 'lucide-react'

type AuthPageProps = {
  onSuccess: (result: AuthResult) => void
  busy: boolean
  setBusy: (value: boolean) => void
  setError: (value: string) => void
}

export function AuthPage({ onSuccess, busy, setBusy, setError }: AuthPageProps) {
  return (
    <main className="page-content auth-layout-container">
      <section className="auth-card-panel" aria-label="Connexion et création de compte">
        <div className="auth-panel-header">
          <div className="auth-icon-badge">
            <CircleUserRound size={32} strokeWidth={1.5} />
          </div>
          <span className="eyebrow">Bienvenue sur neneen</span>
          <h1>
            Espace Membre<span className="dot">.</span>
          </h1>
          <p>
            Connectez-vous ou créez votre compte pour réserver vos activités et suivre vos
            commandes.
          </p>
        </div>

        <AccountForms onSuccess={onSuccess} busy={busy} setBusy={setBusy} setError={setError} />
      </section>
    </main>
  )
}
