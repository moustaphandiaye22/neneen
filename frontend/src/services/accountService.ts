import type { Row } from '../types'
import { api } from './api'
export async function chargerEspaceClient(token: string) {
  const [bookings, orders] = await Promise.all([
    api<{ bookings: Row[] }>('/bookings', token),
    api<{ orders: Row[] }>('/orders', token),
  ])
  return { bookings: bookings.bookings, orders: orders.orders }
}
export const cancelBooking = (token: string, id: string) =>
  api(`/bookings/${id}/cancel`, token, { method: 'POST' })
export const joinWaitlist = (token: string, activityId: string) =>
  api(`/activities/${activityId}/waitlist`, token, { method: 'POST' })
export const getTicket = (token: string, id: string) =>
  api<{ qr: string; booking: Row }>(`/bookings/${id}/ticket`, token)
