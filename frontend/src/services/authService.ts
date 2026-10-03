import {
  connexionSchema,
  inscriptionSchema,
  emailSchema,
  resetSchema,
  tokenSchema,
  profilSchema,
  passwordSchema,
} from '@neneen/contracts'
import type { AuthResult } from '../types'
import { api } from './api'
import { validerAvec } from './validation'
export const connecter = (input: unknown) =>
  api<AuthResult>('/auth/login', null, {
    method: 'POST',
    body: JSON.stringify(validerAvec(connexionSchema, input)),
  })
export const creerCompte = (input: unknown) =>
  api<AuthResult>('/auth/register', null, {
    method: 'POST',
    body: JSON.stringify(validerAvec(inscriptionSchema, input)),
  })
export const getSession = (token: string) => api<{ user: AuthResult['user'] }>('/auth/me', token)
export const logout = () => api('/auth/logout', null, { method: 'POST' })
export const forgotPassword = (input: unknown) =>
  api<{ message: string }>('/auth/forgot-password', null, {
    method: 'POST',
    body: JSON.stringify(validerAvec(emailSchema, input)),
  })
export const resetPassword = (input: unknown) =>
  api<{ message: string }>('/auth/reset-password', null, {
    method: 'POST',
    body: JSON.stringify(validerAvec(resetSchema, input)),
  })
export const verifyEmail = (input: unknown) =>
  api<{ message: string }>('/auth/verify-email', null, {
    method: 'POST',
    body: JSON.stringify(validerAvec(tokenSchema, input)),
  })
export const saveProfile = (token: string, input: unknown) =>
  api<{ user: AuthResult['user'] }>('/auth/profile', token, {
    method: 'PATCH',
    body: JSON.stringify(validerAvec(profilSchema, input)),
  })
export const changePassword = (token: string, input: unknown) =>
  api<{ message: string }>('/auth/change-password', token, {
    method: 'POST',
    body: JSON.stringify(validerAvec(passwordSchema, input)),
  })
export const deleteAccount = (token: string, password: string) =>
  api('/auth/account', token, { method: 'DELETE', body: JSON.stringify({ password }) })
export const resendVerification = (token: string) =>
  api('/auth/resend-verification', token, { method: 'POST' })
