import { verifyEmail } from '../../services/authService'

interface VerifyEmailPageProps {
  setNotice: (notice: string) => void
  setError: (error: string) => void
}

export function VerifyEmailPage({ setNotice, setError }: VerifyEmailPageProps) {
  return (
    <main className="page-content narrow-content">
      <h1>Vérifier mon adresse e-mail</h1>
      <button
        className="button button-dark"
        onClick={() => {
          const token = new URLSearchParams(location.hash.split('?')[1]).get('token')
          void verifyEmail({ token })
            .then((result) => {
              setNotice(result.message)
              location.hash = '/account'
            })
            .catch((reason) => setError((reason as Error).message))
        }}
      >
        Vérifier mon adresse
      </button>
    </main>
  )
}
