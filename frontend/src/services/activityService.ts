import { reservationSchema } from '@neneen/contracts'
import type { Activity } from '../types'
import { api } from './api'
import { validerAvec } from './validation'

export async function listerActivites() {
  const result = await api<{ activities: Activity[] }>('/activities', null)
  return result.activities
}

export async function obtenirActivite(id: string) {
  const result = await api<{ activity: Activity }>(`/activities/${id}`, null)
  return result.activity
}

export function reserverActivite(input: unknown, token: string) {
  const reservation = validerAvec(reservationSchema, input)
  return api<{ booking: unknown; paymentStatus: string; message: string }>('/bookings', token, {
    method: 'POST',
    body: JSON.stringify(reservation),
  })
}
