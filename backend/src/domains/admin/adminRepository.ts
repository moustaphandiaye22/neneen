import type { Prisma } from '@prisma/client'
import type { Activite, Produit } from '@neneen/contracts'
import { prisma } from '../../lib/prisma.js'
import {
  releaseBooking,
  restoreStock,
  enqueueNotification,
} from '../commerce/transactionHelpers.js'
import { assertOrderTransition } from '../commerce/commercePolicy.js'
import { httpError } from '../../errors/httpError.js'

const userSummary = { firstName: true, lastName: true, email: true, phone: true } as const

export const adminRepository = {
  listProductOptions() {
    return Promise.all([
      prisma.productColorOption.findMany({ orderBy: { label: 'asc' } }),
      prisma.productSizeOption.findMany({ orderBy: { position: 'asc' } }),
    ])
  },
  getSiteSettings() {
    return prisma.siteSettings.upsert({
      where: { id: 'main' },
      create: { id: 'main' },
      update: {},
    })
  },
  updateSiteSettings(data: Prisma.SiteSettingsUpdateInput) {
    return prisma.siteSettings.upsert({
      where: { id: 'main' },
      create: { ...(data as Prisma.SiteSettingsCreateInput), id: 'main' },
      update: data,
    })
  },
  async getDashboard() {
    const [customers, activities, bookings, orders, unreadMessages, revenue] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.activity.count(),
      prisma.booking.count(),
      prisma.order.count(),
      prisma.contactMessage.count({ where: { status: 'NEW' } }),
      prisma.payment.aggregate({
        where: { status: 'SUCCEEDED' },
        _sum: { amount: true },
      }),
    ])
    return {
      customers,
      activities,
      bookings,
      orders,
      unreadMessages,
      revenue: revenue._sum.amount ?? 0,
    }
  },

  listActivities() {
    return prisma.activity.findMany({ orderBy: { startsAt: 'desc' } })
  },
  findActivity(id: string) {
    return prisma.activity.findUnique({ where: { id } })
  },
  createActivity(input: Activite) {
    return prisma.activity.create({ data: input })
  },
  async cancelActivity(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Activity" WHERE id = ${id} FOR UPDATE`
      const activity = await tx.activity.findUnique({ where: { id } })
      if (!activity) throw httpError(404, 'Activité introuvable.')
      if (activity.status === 'CANCELLED') return activity
      const bookings = await tx.booking.findMany({
        where: { activityId: id, status: { in: ['PENDING', 'CONFIRMED'] } },
      })
      for (const booking of bookings) await releaseBooking(tx, booking.id, ['PENDING', 'CONFIRMED'])
      await tx.waitlist.deleteMany({ where: { activityId: id } })
      return tx.activity.update({ where: { id }, data: { status: 'CANCELLED' } })
    })
  },
  updateActivity(id: string, input: Prisma.ActivityUpdateInput) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Activity" WHERE id = ${id} FOR UPDATE`
      const current = await tx.activity.findUnique({ where: { id } })
      if (!current) throw httpError(404, 'Activité introuvable.')
      if (typeof input.capacity === 'number' && input.capacity < current.reserved)
        throw httpError(409, 'La capacité ne peut pas être inférieure aux places déjà réservées.')
      return tx.activity.update({ where: { id }, data: input })
    })
  },

  listProducts() {
    return prisma.product.findMany({ include: { variants: true }, orderBy: { createdAt: 'desc' } })
  },
  async createProduct(input: Produit) {
    return prisma.product.create({
      data: {
        ...input,
        variants: {
          create: input.sizes.map((size, index) => ({
            size,
            color: input.color,
            stock:
              Math.floor(input.stock / input.sizes.length) +
              (index < input.stock % input.sizes.length ? 1 : 0),
          })),
        },
      },
    })
  },
  updateProduct(id: string, input: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data: input })
  },
  hideProduct(id: string) {
    return prisma.product.update({ where: { id }, data: { active: false } })
  },

  listCustomers() {
    return prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, ...userSummary, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
  },
  async changeRole(actorId: string, id: string, role: 'CUSTOMER' | 'STAFF' | 'ADMIN') {
    if (actorId === id) throw httpError(409, 'Vous ne pouvez pas modifier votre propre rôle.')
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({ where: { id, deletedAt: null } })
      if (!user) throw httpError(404, 'Utilisateur introuvable.')
      const updated = await tx.user.update({
        where: { id },
        data: { role, sessionVersion: { increment: 1 } },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
      })
      await tx.refreshToken.updateMany({ where: { userId: id }, data: { revokedAt: new Date() } })
      await tx.auditLog.create({
        data: { actorId, action: `ROLE:${user.role}->${role}`, targetId: id },
      })
      return updated
    })
  },
  listBookings() {
    return prisma.booking.findMany({
      include: { user: { select: userSummary }, activity: true, payments: true },
      orderBy: { createdAt: 'desc' },
    })
  },
  listOrders() {
    return prisma.order.findMany({
      include: { user: { select: userSummary }, items: true, payments: true },
      orderBy: { createdAt: 'desc' },
    })
  },
  listPayments() {
    return prisma.payment.findMany({
      include: { user: { select: userSummary } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  },
  listMessages() {
    return prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } })
  },

  setBookingStatus(id: string, status: 'PENDING' | 'CONFIRMED' | 'CANCELLED') {
    return prisma.$transaction(async (tx) => {
      const initial = await tx.booking.findUnique({ where: { id } })
      if (!initial) return { kind: 'notFound' as const }
      await tx.$queryRaw`SELECT id FROM "Activity" WHERE id = ${initial.activityId} FOR UPDATE`
      const booking = await tx.booking.findUniqueOrThrow({
        where: { id },
        include: { activity: true },
      })
      if (booking.status === status) return { kind: 'updated' as const, booking }
      if (status === 'CANCELLED') {
        if (booking.status === 'REFUNDED') return { kind: 'statusChanged' as const }
        await releaseBooking(tx, id, ['PENDING', 'CONFIRMED'])
      } else if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
        return { kind: 'statusChanged' as const }
      } else if (status === 'CONFIRMED' && booking.paymentMethod !== 'CASH') {
        return { kind: 'statusChanged' as const }
      } else {
        await tx.booking.update({ where: { id }, data: { status, expiresAt: null } })
      }
      return {
        kind: 'updated' as const,
        booking: await tx.booking.findUniqueOrThrow({ where: { id } }),
      }
    })
  },
  setOrderStatus(
    id: string,
    status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED',
  ) {
    return prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id } })
      if (!current) return { kind: 'notFound' as const }
      await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${id} FOR UPDATE`
      const order = await tx.order.findUniqueOrThrow({ where: { id } })
      assertOrderTransition(order.status, status, order.paymentMethod === 'CASH')
      if (order.status === status) return { kind: 'updated' as const, order }
      if (status === 'CANCELLED') {
        await restoreStock(tx, id)
        await tx.payment.updateMany({
          where: { orderId: id, status: 'SUCCEEDED' },
          data: { status: 'REFUND_PENDING' },
        })
      }
      if (status === 'COMPLETED' && !order.paidAt)
        throw httpError(409, 'Confirmez le paiement avant de terminer la commande.')
      const updated = await tx.order.update({ where: { id }, data: { status } })
      await enqueueNotification(
        tx,
        order.userId,
        `order-status:${id}:${status}`,
        'Statut de commande',
        `Votre commande ${order.reference} est maintenant ${status}.`,
      )
      return { kind: 'updated' as const, order: updated }
    })
  },
  async setVariantStock(productId: string, size: string, stock: number) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } })
      if (!product) throw httpError(404, 'Produit introuvable.')
      const variant = await tx.productVariant.upsert({
        where: { productId_size: { productId, size } },
        create: { productId, size, color: product.color, stock },
        update: { stock },
      })
      const total = await tx.productVariant.aggregate({
        where: { productId },
        _sum: { stock: true },
      })
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: total._sum.stock ?? 0,
          sizes: { set: [...new Set([...product.sizes, size])] },
        },
      })
      return variant
    })
  },
  setMessageStatus(id: string, status: 'NEW' | 'READ' | 'REPLIED') {
    return prisma.contactMessage.update({ where: { id }, data: { status } })
  },
  replyMessage(id: string, replyText: string) {
    return prisma.contactMessage.update({
      where: { id },
      data: { status: 'REPLIED', replyText },
    })
  },
  deleteProduct(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id } })
      await tx.cartItem.deleteMany({ where: { productId: id } })
      return tx.product.delete({ where: { id } })
    })
  },
  deleteActivity(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.booking.deleteMany({ where: { activityId: id } })
      await tx.waitlist.deleteMany({ where: { activityId: id } })
      return tx.activity.delete({ where: { id } })
    })
  },
}
