import type { Prisma } from '@prisma/client'
import { httpError } from '../errors/httpError.js'
export async function enqueueNotification(
  tx: Prisma.TransactionClient,
  userId: string,
  key: string,
  subject: string,
  body: string,
) {
  const user = await tx.user.findFirst({ where: { id: userId, deletedAt: null } })
  if (!user) return
  for (const [channel, recipient] of [
    ['EMAIL', user.email],
    ['WHATSAPP', user.phone],
  ]) {
    await tx.notification.upsert({
      where: { dedupeKey: `${key}:${channel}` },
      create: { dedupeKey: `${key}:${channel}`, userId, channel, recipient, subject, body },
      update: {},
    })
  }
}
export async function releaseBooking(
  tx: Prisma.TransactionClient,
  id: string,
  allowed: ('PENDING' | 'CONFIRMED')[],
) {
  const booking = await tx.booking.findUniqueOrThrow({ where: { id } })
  const changed = await tx.booking.updateMany({
    where: { id, status: { in: allowed } },
    data: { status: 'CANCELLED', expiresAt: null },
  })
  if (!changed.count) return false
  await tx.activity.update({
    where: { id: booking.activityId },
    data: { reserved: { decrement: booking.quantity } },
  })
  await tx.payment.updateMany({
    where: { bookingId: id, status: 'SUCCEEDED' },
    data: { status: 'REFUND_PENDING' },
  })
  await enqueueNotification(
    tx,
    booking.userId,
    `cancel:${id}`,
    'Réservation annulée',
    `Votre réservation ${booking.reference} est annulée. Tout paiement reçu sera remboursé.`,
  )
  return true
}
export async function commitStock(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  })
  if (order.stockCommitted) return
  for (const item of [...order.items].sort((a, b) =>
    `${a.productId}:${a.size}`.localeCompare(`${b.productId}:${b.size}`),
  )) {
    const result = await tx.productVariant.updateMany({
      where: {
        productId: item.productId,
        size: item.size,
        stock: { gte: item.quantity },
        product: { active: true },
      },
      data: { stock: { decrement: item.quantity } },
    })
    if (!result.count)
      throw httpError(409, `Stock insuffisant pour ${item.name}, taille ${item.size}.`)
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    })
  }
  await tx.order.update({ where: { id: orderId }, data: { stockCommitted: true } })
}
export async function restoreStock(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order.stockCommitted) return
  for (const item of order.items) {
    await tx.productVariant.update({
      where: { productId_size: { productId: item.productId, size: item.size } },
      data: { stock: { increment: item.quantity } },
    })
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    })
  }
  await tx.order.update({ where: { id: orderId }, data: { stockCommitted: false } })
}
