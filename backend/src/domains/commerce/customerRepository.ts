import { prisma } from '../../lib/prisma.js'
import type { Commande, Reservation } from '@neneen/contracts'
import { httpError } from '../../errors/httpError.js'
import { env } from '../../config.js'
import { assertCancellationAllowed, mergeCartLines } from './commercePolicy.js'
import { enqueueNotification, releaseBooking } from './transactionHelpers.js'

export const listBookings = (userId: string) =>
  prisma.booking.findMany({
    where: { userId },
    include: { activity: true, payments: true },
    orderBy: { createdAt: 'desc' },
  })
export const listOrders = (userId: string) =>
  prisma.order.findMany({
    where: { userId },
    include: { items: true, payments: true },
    orderBy: { createdAt: 'desc' },
  })
export async function createBooking(userId: string, input: Reservation) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Activity" WHERE id = ${input.activityId} FOR UPDATE`
    const activity = await tx.activity.findFirst({
      where: { id: input.activityId, status: 'PUBLISHED', startsAt: { gt: new Date() } },
    })
    if (!activity) return { kind: 'unavailable' as const }
    const held = await tx.activity.updateMany({
      where: { id: activity.id, reserved: { lte: activity.capacity - input.quantity } },
      data: { reserved: { increment: input.quantity } },
    })
    if (!held.count) return { kind: 'full' as const }
    const booking = await tx.booking.create({
      data: {
        userId,
        activityId: activity.id,
        quantity: input.quantity,
        total: activity.price * input.quantity,
        paymentMethod: input.paymentMethod,
        expiresAt:
          input.paymentMethod === 'CASH'
            ? null
            : new Date(Date.now() + env.BOOKING_HOLD_MINUTES * 60000),
      },
      include: { activity: true },
    })
    if (input.paymentMethod === 'CASH')
      await tx.payment.create({
        data: {
          userId,
          bookingId: booking.id,
          idempotencyKey: `cash:${booking.id}`,
          method: 'CASH',
          amount: booking.total,
          providerReference: `cash:${booking.id}`,
        },
      })
    await enqueueNotification(
      tx,
      userId,
      `booking:${booking.id}`,
      'Réservation enregistrée',
      `Référence ${booking.reference}. ${input.paymentMethod === 'CASH' ? 'Paiement sur place.' : `Réglez sous ${env.BOOKING_HOLD_MINUTES} minutes pour conserver vos places.`}`,
    )
    return { kind: 'created' as const, booking }
  })
}
export async function createOrder(userId: string, input: Commande) {
  return prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: input.items.map((item) => item.productId) }, active: true },
      include: { variants: true },
    })
    const quantities = new Map<string, number>()
    const lines = input.items.map((item) => {
      const product = products.find((product) => product.id === item.productId)
      const variant = product?.variants.find((variant) => variant.size === item.size)
      if (!product || !variant)
        throw httpError(400, 'Un produit ou une taille n’est plus disponible.')
      const key = `${item.productId}:${item.size}`
      const quantity = (quantities.get(key) ?? 0) + item.quantity
      quantities.set(key, quantity)
      if (variant.stock < quantity)
        throw httpError(409, `Stock insuffisant pour ${product.name}, taille ${item.size}.`)
      return {
        productId: product.id,
        name: product.name,
        size: item.size,
        unitPrice: product.price,
        quantity: item.quantity,
      }
    })
    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
    const order = await tx.order.create({
      data: {
        userId,
        subtotal,
        shippingFee: input.shippingFee,
        total: subtotal + input.shippingFee,
        shippingAddress: input.shippingAddress,
        paymentMethod: input.paymentMethod,
        items: { create: lines },
      },
      include: { items: true },
    })
    if (input.paymentMethod === 'CASH')
      await tx.payment.create({
        data: {
          userId,
          orderId: order.id,
          idempotencyKey: `cash:${order.id}`,
          method: 'CASH',
          amount: order.total,
          providerReference: `cash:${order.id}`,
        },
      })
    await tx.cartItem.deleteMany({ where: { cart: { userId } } })
    await enqueueNotification(
      tx,
      userId,
      `order:${order.id}`,
      'Commande enregistrée',
      `Commande ${order.reference}, total ${order.total} FCFA. ${input.paymentMethod === 'CASH' ? 'Paiement à la livraison.' : 'En attente de paiement.'}`,
    )
    return { kind: 'created' as const, order }
  })
}
export async function cancelBooking(userId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const initial = await tx.booking.findFirst({ where: { id, userId } })
    if (!initial) throw httpError(404, 'Réservation introuvable.')
    await tx.$queryRaw`SELECT id FROM "Activity" WHERE id = ${initial.activityId} FOR UPDATE`
    const booking = await tx.booking.findUniqueOrThrow({
      where: { id },
      include: { activity: true },
    })
    if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') return booking
    assertCancellationAllowed(booking.activity.startsAt)
    await releaseBooking(tx, id, ['PENDING', 'CONFIRMED'])
    return tx.booking.findUniqueOrThrow({ where: { id } })
  })
}
export async function joinWaitlist(userId: string, activityId: string) {
  const activity = await prisma.activity.findFirst({
    where: { id: activityId, status: 'PUBLISHED', startsAt: { gt: new Date() } },
  })
  if (!activity) throw httpError(404, 'Activité introuvable.')
  if (activity.reserved < activity.capacity)
    throw httpError(409, 'Des places sont disponibles : réservez directement.')
  return prisma.waitlist.upsert({
    where: { userId_activityId: { userId, activityId } },
    create: { userId, activityId },
    update: {},
  })
}
export const getTicket = (userId: string, id: string) =>
  prisma.booking.findFirst({
    where: {
      id,
      userId,
      OR: [{ status: 'CONFIRMED' }, { status: 'PENDING', paymentMethod: 'CASH' }],
    },
    include: { activity: true },
  })
export const getCart = (userId: string) =>
  prisma.cart.findUnique({ where: { userId }, include: { items: true } })
export async function saveCart(
  userId: string,
  items: { productId: string; size: string; quantity: number }[],
  merge: boolean,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`
    const cart = await tx.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: { items: true },
    })
    const lines = merge
      ? mergeCartLines(
          cart.items.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
          items,
        )
      : mergeCartLines([], items)
    for (const line of lines) {
      const variant = await tx.productVariant.findUnique({
        where: { productId_size: { productId: line.productId, size: line.size } },
        include: { product: true },
      })
      if (!variant || !variant.product.active || variant.stock < line.quantity)
        throw httpError(409, 'Un article du panier n’est plus disponible dans cette quantité.')
    }
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
    await tx.cartItem.createMany({ data: lines.map((line) => ({ ...line, cartId: cart.id })) })
    return tx.cart.findUniqueOrThrow({ where: { id: cart.id }, include: { items: true } })
  })
}
