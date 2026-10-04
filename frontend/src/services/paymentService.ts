import { paymentSchema } from '@neneen/contracts'
import { api } from './api'
import { validerAvec } from './validation'
export type Payment = {
  id: string
  status: string
  amount: number
  checkoutUrl: string | null
  method: string
  bookingId?: string | null
  orderId?: string | null
}
export async function getPaymentConfig() {
  return api<{ enabled: boolean }>('/payments/config', null)
}
export async function initiatePayment(token: string, input: unknown) {
  const result = await api<{ payment: Payment }>('/payments', token, {
    method: 'POST',
    body: JSON.stringify(validerAvec(paymentSchema, input)),
  })
  return result.payment
}
export async function listPayments(token: string) {
  return (await api<{ payments: Payment[] }>('/payments', token)).payments
}
