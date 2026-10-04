import type { z } from 'zod'
import type { paymentSchema } from '@neneen/contracts'
import { prisma } from '../../lib/prisma.js'
import { httpError, HttpError } from '../../errors/httpError.js'
import { commitStock, enqueueNotification } from '../commerce/transactionHelpers.js'
export const paymentRepository = {
  find: (id: string) => prisma.payment.findUnique({ where: { id } }),
  findReference: (providerReference: string) =>
    prisma.payment.findUnique({ where: { providerReference } }),
  list: (userId: string) =>
    prisma.payment.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  async prepare(userId: string, input: z.infer<typeof paymentSchema>) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`
      const previous = await tx.payment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      })
      if (previous) {
        if (
          previous.userId !== userId ||
          previous.bookingId !== (input.bookingId ?? null) ||
          previous.orderId !== (input.orderId ?? null) ||
          previous.method !== input.method
        )
          throw httpError(409, 'Clé de paiement déjà utilisée.')
        return { payment: previous, created: false }
      }
      const target = input.bookingId
        ? await tx.booking.findFirst({
            where: { id: input.bookingId, userId },
            include: { activity: true },
          })
        : await tx.order.findFirst({ where: { id: input.orderId, userId } })
      if (!target) throw httpError(404, 'Réservation ou commande introuvable.')
      if (target.status !== 'PENDING') throw httpError(409, 'Ce paiement ne peut plus être initié.')
      if ('expiresAt' in target && target.expiresAt && target.expiresAt <= new Date())
        throw httpError(409, 'Le délai de réservation est expiré.')
      if (
        'activity' in target &&
        (target.activity.status !== 'PUBLISHED' || target.activity.startsAt <= new Date())
      )
        throw httpError(409, 'Cette activité n’est plus disponible.')
      const active = await tx.payment.findFirst({
        where: {
          userId,
          ...(input.bookingId ? { bookingId: input.bookingId } : { orderId: input.orderId }),
          status: { in: ['PENDING', 'SUCCEEDED', 'REFUND_PENDING'] },
        },
      })
      if (active) return { payment: active, created: false }
      return {
        payment: await tx.payment.create({ data: { userId, ...input, amount: target.total } }),
        created: true,
      }
    })
  },
  checkout: (id: string, reference: string, url: string | null) =>
    prisma.payment.update({
      where: { id },
      data: { providerReference: reference, checkoutUrl: url },
    }),
  failed: (id: string) =>
    prisma.payment.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'FAILED', failure: 'Impossible d’initier le paiement.' },
    }),
  async settle(
    id: string,
    status: 'SUCCEEDED' | 'FAILED' | 'PENDING',
    amount: number,
    eventId: string,
  ) {
    const initial = await prisma.payment.findUniqueOrThrow({ where: { id } })
    if (amount !== initial.amount) throw httpError(400, 'Montant du paiement incorrect.')
    if (status === 'PENDING') return initial
    try {
      return await prisma.$transaction(async (tx) => {
        if (initial.bookingId) {
          const booking = await tx.booking.findUniqueOrThrow({ where: { id: initial.bookingId } })
          await tx.$queryRaw`SELECT id FROM "Activity" WHERE id = ${booking.activityId} FOR UPDATE`
        }
        if (initial.orderId)
          await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${initial.orderId} FOR UPDATE`
        await tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${id} FOR UPDATE`
        const payment = await tx.payment.findUniqueOrThrow({ where: { id } })
        if (['SUCCEEDED', 'REFUND_PENDING', 'REFUNDED'].includes(payment.status)) return payment
        const existing = await tx.paymentEvent.findUnique({ where: { eventId } })
        if (existing) return payment
        await tx.paymentEvent.create({ data: { paymentId: id, eventId, type: status } })
        if (status === 'FAILED')
          return tx.payment.update({ where: { id }, data: { status: 'FAILED' } })
        let refund = false
        if (payment.bookingId) {
          const booking = await tx.booking.findUniqueOrThrow({
            where: { id: payment.bookingId },
            include: { activity: true },
          })
          refund =
            booking.status !== 'PENDING' ||
            (booking.expiresAt !== null && booking.expiresAt <= new Date()) ||
            booking.activity.status !== 'PUBLISHED'
          if (!refund)
            await tx.booking.update({
              where: { id: booking.id },
              data: { status: 'CONFIRMED', expiresAt: null },
            })
        }
        if (payment.orderId) {
          const order = await tx.order.findUniqueOrThrow({ where: { id: payment.orderId } })
          refund = order.status === 'CANCELLED' || order.paidAt !== null
          if (!refund) {
            await commitStock(tx, order.id)
            await tx.order.update({
              where: { id: order.id },
              data: {
                status: order.status === 'PENDING' ? 'PAID' : order.status,
                paidAt: new Date(),
              },
            })
          }
        }
        if (refund && payment.method === 'CASH')
          throw httpError(
            409,
            'Cette prestation est annulée. Aucun encaissement ne peut être confirmé.',
          )
        const updated = await tx.payment.update({
          where: { id },
          data: { status: refund ? 'REFUND_PENDING' : 'SUCCEEDED' },
        })
        await enqueueNotification(
          tx,
          payment.userId,
          `payment:${id}`,
          refund ? 'Remboursement en cours' : 'Paiement confirmé',
          refund
            ? 'Votre paiement est reçu mais la prestation n’est plus disponible. Un remboursement est à traiter.'
            : `Paiement de ${amount} FCFA confirmé. Retrouvez votre reçu dans votre compte.`,
        )
        return updated
      })
    } catch (error) {
      if (
        !(error instanceof HttpError) ||
        error.status !== 409 ||
        !error.message.startsWith('Stock insuffisant') ||
        status !== 'SUCCEEDED'
      )
        throw error
      return prisma.$transaction(async (tx) => {
        const updated = await tx.payment.update({
          where: { id },
          data: { status: 'REFUND_PENDING', failure: 'Stock devenu indisponible après paiement.' },
        })
        await enqueueNotification(
          tx,
          updated.userId,
          `payment:${id}`,
          'Remboursement en cours',
          'Votre paiement est reçu mais un produit est devenu indisponible. Un remboursement sera traité.',
        )
        return updated
      })
    }
  },
  async confirmRefund(id: string, actorId: string, reference: string) {
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUniqueOrThrow({ where: { id } })
      const changed = await tx.payment.updateMany({
        where: { id, status: 'REFUND_PENDING' },
        data: { status: 'REFUNDED' },
      })
      if (!changed.count) throw httpError(409, 'Ce paiement n’attend pas de remboursement.')
      if (payment.bookingId)
        await tx.booking.updateMany({
          where: { id: payment.bookingId, status: 'CANCELLED' },
          data: { status: 'REFUNDED' },
        })
      await tx.auditLog.create({
        data: { actorId, action: `REFUND_CONFIRMED:${reference}`, targetId: id },
      })
      await enqueueNotification(
        tx,
        payment.userId,
        `refund:${id}`,
        'Remboursement confirmé',
        `Votre remboursement de ${payment.amount} FCFA est confirmé.`,
      )
      return tx.payment.findUniqueOrThrow({ where: { id } })
    })
  },
}
