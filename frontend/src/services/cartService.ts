import { api } from './api'
import type { CartLine } from '../types'
export type StoredCart = { items: { productId: string; size: string; quantity: number }[] }
export async function mergeCart(token: string, lines: CartLine[]) {
  return api<{ cart: StoredCart }>('/cart/merge', token, {
    method: 'POST',
    body: JSON.stringify({
      items: lines.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
    }),
  })
}
export async function saveCart(token: string, lines: CartLine[]) {
  return api<{ cart: StoredCart }>('/cart', token, {
    method: 'PUT',
    body: JSON.stringify({
      items: lines.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
    }),
  })
}
