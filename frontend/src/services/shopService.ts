import { commandeSchema } from '@neneen/contracts'
import type { Product } from '../types'
import { api } from './api'
import { validerAvec } from './validation'

export async function listerProduits() {
  const result = await api<{ products: Product[] }>('/products', null)
  return result.products
}

export function passerCommande(input: unknown, token: string) {
  const order = validerAvec(commandeSchema, input)
  return api<{ order: { id: string }; paymentStatus: string; message: string }>('/orders', token, {
    method: 'POST',
    body: JSON.stringify(order),
  })
}
export function listerCommandes(token: string) {
  return api<{ orders: Record<string, unknown>[] }>('/orders', token)
}
