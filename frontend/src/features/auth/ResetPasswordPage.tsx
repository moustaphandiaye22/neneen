import type { SyntheticEvent } from 'react'
import { resetPassword } from '../../services/authService'

interface ResetPasswordPageProps {
  busy: boolean
  runForm: (
    event: SyntheticEvent<HTMLFormElement>,
    action: (data: FormData) => Promise<void>,
  ) => Promise<void>
  setNotice: (notice: string) => void
}

export function ResetPasswordPage({ busy, runForm, setNotice }: ResetPasswordPageProps) {
  return (
    <main className="page-content narrow-content">
      <h1>Nouveau mot de passe</h1>
      <form
        className="checkout-form"
        onSubmit={(event) =>
          runForm(event, async (data) => {
            const token = new URLSearchParams(location.hash.split('?')[1]).get('token')
            const result = await resetPassword({ token, password: String(data.get('password')) })
            setNotice(result.message)
            location.hash = '/login'
          })
        }
      >
        <label className="form-label">
          Nouveau mot de passe
          <input name="password" type="password" minLength={6} required />
        </label>
        <button className="button button-dark" disabled={busy}>
          Réinitialiser
        </button>
      </form>
    </main>
  )
}
