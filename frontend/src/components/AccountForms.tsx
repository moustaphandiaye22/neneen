import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { connexionSchema, inscriptionSchema } from '@neneen/contracts'
import type { z } from 'zod'
import { useState } from 'react'
import { connecter, creerCompte } from '../services/authService'
import type { AuthResult } from '../types'
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
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const login = useForm<z.input<typeof connexionSchema>>({ resolver: zodResolver(connexionSchema) })
  const register = useForm<z.input<typeof inscriptionSchema>>({
    resolver: zodResolver(inscriptionSchema),
  })
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
  return (
    <form noValidate onSubmit={mode === 'login' ? submitLogin : submitRegister}>
      <label className="form-label">
        Je souhaite
        <select
          value={mode}
          onChange={(event) => setMode(event.target.value as 'login' | 'register')}
        >
          <option value="login">Me connecter</option>
          <option value="register">Créer un compte</option>
        </select>
      </label>
      {mode === 'register' && (
        <div className="field-pair">
          <label className="form-label">
            Prénom
            <input autoComplete="given-name" {...register.register('firstName')} />
            {register.formState.errors.firstName?.message && (
              <small role="alert">{register.formState.errors.firstName.message}</small>
            )}
          </label>
          <label className="form-label">
            Nom
            <input autoComplete="family-name" {...register.register('lastName')} />
            {register.formState.errors.lastName?.message && (
              <small role="alert">{register.formState.errors.lastName.message}</small>
            )}
          </label>
        </div>
      )}
      <label className="form-label">
        Adresse e-mail
        <input
          type="email"
          autoComplete="email"
          {...(mode === 'login' ? login.register('email') : register.register('email'))}
        />
      </label>
      {mode === 'register' && (
        <label className="form-label">
          Téléphone WhatsApp
          <input autoComplete="tel" {...register.register('phone')} />
          {register.formState.errors.phone?.message && (
            <small role="alert">{register.formState.errors.phone.message}</small>
          )}
        </label>
      )}
      <label className="form-label">
        Mot de passe
        <input
          type="password"
          minLength={6}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          {...(mode === 'login' ? login.register('password') : register.register('password'))}
        />
      </label>
      <button className="button button-dark full-button" disabled={busy}>
        {busy ? 'Un instant…' : 'Continuer'}
      </button>
    </form>
  )
}
