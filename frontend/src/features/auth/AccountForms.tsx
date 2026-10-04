import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { connexionSchema, inscriptionSchema } from '@neneen/contracts'
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  User as UserIcon,
} from 'lucide-react'
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
  const login = useForm<z.input<typeof connexionSchema>>({
    resolver: zodResolver(connexionSchema),
    mode: 'onTouched',
  })
  const register = useForm<z.input<typeof inscriptionSchema>>({
    resolver: zodResolver(inscriptionSchema),
    mode: 'onTouched',
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

  const firstNameError = register.formState.errors.firstName?.message
  const lastNameError = register.formState.errors.lastName?.message
  const phoneError = register.formState.errors.phone?.message

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
          Se connecter
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
              <span>
                <UserIcon size={14} /> Prénom
              </span>
              <input
                autoComplete="given-name"
                placeholder="Ex : Moustapha"
                aria-invalid={Boolean(firstNameError)}
                {...register.register('firstName')}
              />
              {firstNameError && (
                <span className="field-error" role="alert">
                  <AlertCircle size={13} /> {firstNameError}
                </span>
              )}
            </label>

            <label className="form-label">
              <span>
                <UserIcon size={14} /> Nom
              </span>
              <input
                autoComplete="family-name"
                placeholder="Ex : Ndiaye"
                aria-invalid={Boolean(lastNameError)}
                {...register.register('lastName')}
              />
              {lastNameError && (
                <span className="field-error" role="alert">
                  <AlertCircle size={13} /> {lastNameError}
                </span>
              )}
            </label>
          </div>
        )}

        <label className="form-label">
          <span>
            <Mail size={14} /> Adresse e-mail
          </span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="votre.email@exemple.com"
            aria-invalid={Boolean(emailError)}
            {...(mode === 'login' ? login.register('email') : register.register('email'))}
          />
          {emailError && (
            <span className="field-error" role="alert">
              <AlertCircle size={13} /> {emailError}
            </span>
          )}
        </label>

        {mode === 'register' && (
          <label className="form-label">
            <span>
              <Phone size={14} /> Téléphone WhatsApp
            </span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+221 77 000 00 00"
              aria-invalid={Boolean(phoneError)}
              {...register.register('phone')}
            />
            {phoneError && (
              <span className="field-error" role="alert">
                <AlertCircle size={13} /> {phoneError}
              </span>
            )}
          </label>
        )}

        <div className="form-label">
          <label
            htmlFor="auth-password"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Lock size={14} /> Mot de passe
          </label>
          <div className="password-field-wrapper">
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'login' ? 'Votre mot de passe' : '6 caractères minimum'}
              aria-invalid={Boolean(passwordError)}
              {...(mode === 'login' ? login.register('password') : register.register('password'))}
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {passwordError && (
            <span className="field-error" role="alert">
              <AlertCircle size={13} /> {passwordError}
            </span>
          )}
        </div>

        {mode === 'login' && (
          <div className="auth-actions-row">
            <a className="auth-forgot-link" href="#/forgot-password">
              Mot de passe oublié ?
            </a>
          </div>
        )}

        <button className="button button-dark full-button auth-submit" disabled={busy}>
          {busy ? 'Traitement en cours…' : mode === 'login' ? 'Me connecter' : 'Créer mon compte'}
          {!busy && <ArrowRight size={16} aria-hidden="true" />}
        </button>

        {mode === 'register' && (
          <p className="auth-legal">
            En créant un compte, vous acceptez nos <a href="#/cgv">Conditions Générales de Vente</a>
            .
          </p>
        )}
      </form>
    </div>
  )
}
