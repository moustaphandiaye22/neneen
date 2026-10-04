import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { connexionSchema, inscriptionSchema } from '@neneen/contracts'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { connecter, creerCompte } from '../../services/authService'
import type { AuthResult } from '../../types'

type Mode = 'login' | 'register'

export function AccountForms({
  onSuccess,
  busy,
  setBusy,
  setError,
}: {
  onSuccess: (result: AuthResult) => void
  busy: boolean
  setBusy: (value: boolean) => void
  setError: (value: string) => void
}) {
  const [mode, setMode] = useState<Mode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const login = useForm<z.input<typeof connexionSchema>>({ resolver: zodResolver(connexionSchema) })
  const register = useForm<z.input<typeof inscriptionSchema>>({
    resolver: zodResolver(inscriptionSchema),
  })

  function switchMode(nextMode: Mode) {
    setMode(nextMode)
    setShowPassword(false)
    setError('')
    login.clearErrors()
    register.clearErrors()
  }

  const submitLogin = login.handleSubmit(async (values) => {
    setBusy(true)
    setError('')
    try {
      onSuccess(await connecter(values))
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setBusy(false)
    }
  })
  const submitRegister = register.handleSubmit(async (values) => {
    setBusy(true)
    setError('')
    try {
      onSuccess(await creerCompte(values))
    } catch (error) {
      setError((error as Error).message)
    } finally {
      setBusy(false)
    }
  })

  const emailError =
    mode === 'login'
      ? login.formState.errors.email?.message
      : register.formState.errors.email?.message
  const passwordError =
    mode === 'login'
      ? login.formState.errors.password?.message
      : register.formState.errors.password?.message

  return (
    <div className="auth-form-shell">
      <div className="auth-tabs" role="group" aria-label="Choisir votre accès">
        <button
          type="button"
          className={mode === 'login' ? 'active' : ''}
          aria-pressed={mode === 'login'}
          onClick={() => switchMode('login')}
        >
          Connexion
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'active' : ''}
          aria-pressed={mode === 'register'}
          onClick={() => switchMode('register')}
        >
          Créer un compte
        </button>
      </div>
      <form
        key={mode}
        className="auth-form"
        noValidate
        onSubmit={mode === 'login' ? submitLogin : submitRegister}
      >
        {mode === 'register' && (
          <div className="field-pair">
            <label className="form-label">
              Prénom
              <input
                autoComplete="given-name"
                placeholder="Votre prénom"
                aria-invalid={Boolean(register.formState.errors.firstName)}
                aria-describedby={
                  register.formState.errors.firstName ? 'auth-first-name-error' : undefined
                }
                {...register.register('firstName')}
              />
              {register.formState.errors.firstName?.message && (
                <small id="auth-first-name-error" role="alert">
                  {register.formState.errors.firstName.message}
                </small>
              )}
            </label>
            <label className="form-label">
              Nom
              <input
                autoComplete="family-name"
                placeholder="Votre nom"
                aria-invalid={Boolean(register.formState.errors.lastName)}
                aria-describedby={
                  register.formState.errors.lastName ? 'auth-last-name-error' : undefined
                }
                {...register.register('lastName')}
              />
              {register.formState.errors.lastName?.message && (
                <small id="auth-last-name-error" role="alert">
                  {register.formState.errors.lastName.message}
                </small>
              )}
            </label>
          </div>
        )}
        <label className="form-label">
          Adresse e-mail
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nom@exemple.com"
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? 'auth-email-error' : undefined}
            {...(mode === 'login' ? login.register('email') : register.register('email'))}
          />
          {emailError && (
            <small id="auth-email-error" role="alert">
              {emailError}
            </small>
          )}
        </label>
        {mode === 'register' && (
          <label className="form-label">
            Téléphone WhatsApp
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+221 77 000 00 00"
              aria-invalid={Boolean(register.formState.errors.phone)}
              aria-describedby={register.formState.errors.phone ? 'auth-phone-error' : undefined}
              {...register.register('phone')}
            />
            {register.formState.errors.phone?.message && (
              <small id="auth-phone-error" role="alert">
                {register.formState.errors.phone.message}
              </small>
            )}
          </label>
        )}
        <div className="form-label">
          <label htmlFor="auth-password">Mot de passe</label>
          <span className="password-field">
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'login' ? 'Votre mot de passe' : '6 caractères minimum'}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? 'auth-password-error' : undefined}
              {...(mode === 'login' ? login.register('password') : register.register('password'))}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
          {passwordError && (
            <small id="auth-password-error" role="alert">
              {passwordError}
            </small>
          )}
        </div>
        {mode === 'login' && (
          <a className="auth-forgot-link" href="#/forgot-password">
            Mot de passe oublié ?
          </a>
        )}
        <button className="button button-dark full-button auth-submit" disabled={busy}>
          {busy ? 'Veuillez patienter…' : mode === 'login' ? 'Me connecter' : 'Créer mon compte'}
          {!busy && <ArrowRight size={16} aria-hidden="true" />}
        </button>
        {mode === 'register' && (
          <p className="auth-legal">
            En créant un compte, vous acceptez nos <a href="#/cgv">conditions générales</a>.
          </p>
        )}
      </form>
    </div>
  )
}
