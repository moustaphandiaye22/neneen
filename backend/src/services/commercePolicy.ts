import { httpError } from '../errors/httpError.js'
export function assertCancellationAllowed(startsAt: Date, now = new Date()) {
  if (startsAt.getTime() - now.getTime() < 7 * 86400000)
    throw httpError(409, 'L’annulation gratuite est possible jusqu’à 7 jours avant le départ.')
}
export function assertOrderTransition(current: string, next: string, cash: boolean) {
  const transitions: Record<string, string[]> = {
    PENDING: cash ? ['PROCESSING', 'CANCELLED'] : ['CANCELLED'],
    PAID: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'COMPLETED', 'CANCELLED'],
    SHIPPED: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
  }
  if (next !== current && !transitions[current]?.includes(next))
    throw httpError(409, 'Ce changement d’état n’est pas autorisé.')
}
export function mergeCartLines<T extends { productId: string; size: string; quantity: number }>(
  stored: T[],
  incoming: T[],
) {
  const lines = new Map(stored.map((line) => [`${line.productId}:${line.size}`, { ...line }]))
  for (const line of incoming) {
    const key = `${line.productId}:${line.size}`
    const old = lines.get(key)
    lines.set(key, { ...line, quantity: Math.min(20, (old?.quantity ?? 0) + line.quantity) })
  }
  if (lines.size > 30) throw httpError(400, 'Votre panier contient trop de références.')
  return [...lines.values()]
}
