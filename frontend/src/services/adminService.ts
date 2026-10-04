import {
  activiteSchema,
  etatCommandeSchema,
  etatMessageSchema,
  etatReservationSchema,
  produitSchema,
} from '@neneen/contracts'
import type { AdminData } from '../types'
import { api, apiUrl } from './api'
import { validerAvec } from './validation'

const adminEndpoints: Record<string, string> = {
  dashboard: '/dashboard',
  activities: '/activities',
  bookings: '/bookings',
  orders: '/orders',
  products: '/products',
  customers: '/customers',
  messages: '/messages',
}

export function chargerVueAdmin(token: string, tab: string) {
  return api<AdminData>(`/admin${adminEndpoints[tab] || adminEndpoints.dashboard}`, token)
}

export function enregistrerActivite(token: string, input: unknown, id?: string) {
  const activity = validerAvec(activiteSchema, input)
  return api(id ? `/admin/activities/${id}` : '/admin/activities', token, {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(activity),
  })
}

export function enregistrerProduit(token: string, input: unknown, id?: string) {
  const product = validerAvec(produitSchema, input)
  return api(id ? `/admin/products/${id}` : '/admin/products', token, {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(product),
  })
}

export function masquerProduit(token: string, id: string) {
  return api(`/admin/products/${id}`, token, { method: 'DELETE' })
}

export function modifierEtatReservation(token: string, id: string, input: unknown) {
  const payload = validerAvec(etatReservationSchema, input)
  return api(`/admin/bookings/${id}`, token, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function modifierEtatCommande(token: string, id: string, input: unknown) {
  const payload = validerAvec(etatCommandeSchema, input)
  return api(`/admin/orders/${id}`, token, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function modifierEtatMessage(token: string, id: string, input: unknown) {
  const payload = validerAvec(etatMessageSchema, input)
  return api(`/admin/messages/${id}`, token, { method: 'PATCH', body: JSON.stringify(payload) })
}

export function annulerActivite(token: string, id: string) {
  return api(`/admin/activities/${id}`, token, { method: 'DELETE' })
}
export const setVariantStock = (
  token: string,
  productId: string,
  input: { size: string; color: string; stock: number },
) =>
  api(`/admin/products/${productId}/variants`, token, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
export const listContents = (token: string) =>
  api<{ contents: { slug: string; title: string; body: string; published: boolean }[] }>(
    '/admin/content',
    token,
  )
export const saveContent = (
  token: string,
  slug: string,
  input: { title: string; body: string; published: boolean },
) => api(`/admin/content/${slug}`, token, { method: 'PUT', body: JSON.stringify(input) })
export const checkIn = (token: string, secret: string) =>
  api('/admin/check-in', token, { method: 'POST', body: JSON.stringify({ secret }) })
export const participantsCsv = async (token: string, activityId: string) => {
  const response = await fetch(apiUrl(`/admin/activities/${activityId}/participants.csv`), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Export impossible.')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'participants.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export const changeUserRole = (token: string, id: string, role: 'CUSTOMER' | 'STAFF' | 'ADMIN') =>
  api(`/admin/customers/${id}/role`, token, { method: 'PATCH', body: JSON.stringify({ role }) })

export const confirmCash = (token: string, paymentId: string) =>
  api(`/payments/${paymentId}/confirm-cash`, token, { method: 'POST' })

export const confirmRefund = (token: string, paymentId: string, reference: string) =>
  api(`/payments/${paymentId}/confirm-refund`, token, {
    method: 'POST',
    body: JSON.stringify({ reference }),
  })
