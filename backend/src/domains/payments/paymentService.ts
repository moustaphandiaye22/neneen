import type { z } from 'zod'
import type { paymentSchema } from '@neneen/contracts'
import { paymentRepository } from './paymentRepository.js'
import { paymentProviders, type PaymentMethod, type PaymentProvider } from './paymentProvider.js'
import { httpError } from '../../errors/httpError.js'
export function createPaymentService(
  repository: typeof paymentRepository,
  providers: Record<PaymentMethod, PaymentProvider>,
) {
  return {
    async initiate(userId: string, input: z.infer<typeof paymentSchema>) {
      const { payment, created } = await repository.prepare(userId, input)
      if (!created) return payment
      try {
        const checkout = await providers[input.method].create({
          id: payment.id,
          amount: payment.amount,
        })
        return await repository.checkout(payment.id, checkout.reference, checkout.url)
      } catch (error) {
        await repository.failed(payment.id)
        throw error
      }
    },
    async synchronize(reference: string) {
      const payment = await repository.findReference(reference)
      if (!payment || payment.method === 'CASH') throw httpError(404, 'Paiement introuvable.')
      const result = await providers[payment.method as PaymentMethod].verify(reference)
      return repository.settle(
        payment.id,
        result.status,
        result.amount,
        `${reference}:${result.status}`,
      )
    },
    async confirmCash(id: string) {
      const payment = await repository.find(id)
      if (!payment || payment.method !== 'CASH')
        throw httpError(400, 'Ce paiement n’est pas en espèces.')
      if (payment.status !== 'PENDING') throw httpError(409, 'Ce paiement est déjà traité.')
      return repository.settle(id, 'SUCCEEDED', payment.amount, `cash:${id}`)
    },
    async get(userId: string, id: string) {
      const payment = await repository.find(id)
      if (!payment || payment.userId !== userId) throw httpError(404, 'Paiement introuvable.')
      return payment
    },
    list: repository.list,
    confirmRefund: repository.confirmRefund,
  }
}
export const paymentService = createPaymentService(paymentRepository, paymentProviders)
