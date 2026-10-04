import { AccountForms } from './AccountForms'
import type { AuthResult } from '../../types'

type AuthPageProps = {
  onSuccess: (result: AuthResult) => void
  busy: boolean
  setBusy: (value: boolean) => void
  setError: (value: string) => void
}

export function AuthPage({ onSuccess, busy, setBusy, setError }: AuthPageProps) {
  return (
    <main className="page-content auth-layout">
      <section className="auth-panel" aria-label="Connexion et création de compte">
        <AccountForms onSuccess={onSuccess} busy={busy} setBusy={setBusy} setError={setError} />
      </section>
    </main>
  )
}
