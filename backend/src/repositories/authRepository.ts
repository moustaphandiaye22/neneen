import type { Inscription } from '@neneen/contracts'
import { prisma } from '../lib/prisma.js'
import { httpError } from '../errors/httpError.js'
import { releaseBooking, restoreStock } from './transactionHelpers.js'

export const publicUser = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  emailVerifiedAt: true,
} as const
export const authRepository = {
  findByEmail: (email: string) => prisma.user.findFirst({ where: { email, deletedAt: null } }),
  findById: (id: string) => prisma.user.findFirst({ where: { id, deletedAt: null } }),
  findPublicUserById: (id: string) =>
    prisma.user.findFirst({ where: { id, deletedAt: null }, select: publicUser }),
  createCustomer: (profile: Omit<Inscription, 'password'>, passwordHash: string) =>
    prisma.user.create({ data: { ...profile, passwordHash } }),
  saveRefresh: (userId: string, tokenHash: string, expiresAt: Date) =>
    prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } }),
  async rotateRefresh(tokenHash: string, nextHash: string, expiresAt: Date) {
    return prisma.$transaction(async (tx) => {
      const token = await tx.refreshToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      })
      if (!token || token.revokedAt || token.expiresAt <= new Date() || token.user.deletedAt)
        throw httpError(401, 'Session expirée.')
      const changed = await tx.refreshToken.updateMany({
        where: { id: token.id, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      if (!changed.count) throw httpError(401, 'Session déjà renouvelée.')
      await tx.refreshToken.create({
        data: { userId: token.userId, tokenHash: nextHash, expiresAt },
      })
      return token.user
    })
  },
  revokeRefresh: (tokenHash: string) =>
    prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  async saveAction(
    userId: string,
    purpose: string,
    tokenHash: string,
    expiresAt: Date,
    body: string,
  ) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } })
      await tx.actionToken.updateMany({
        where: { userId, purpose, usedAt: null },
        data: { usedAt: new Date() },
      })
      await tx.actionToken.create({ data: { userId, purpose, tokenHash, expiresAt } })
      await tx.notification.create({
        data: {
          userId,
          channel: 'EMAIL',
          recipient: user.email,
          subject:
            purpose === 'RESET'
              ? 'Réinitialisation du mot de passe'
              : 'Vérification de votre e-mail',
          body,
          dedupeKey: tokenHash,
        },
      })
    })
  },
  async consumeAction(tokenHash: string, purpose: string, passwordHash?: string) {
    return prisma.$transaction(async (tx) => {
      const token = await tx.actionToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      })
      if (
        !token ||
        token.purpose !== purpose ||
        token.usedAt ||
        token.expiresAt <= new Date() ||
        token.user.deletedAt
      )
        throw httpError(400, 'Lien invalide ou expiré.')
      const changed = await tx.actionToken.updateMany({
        where: { id: token.id, usedAt: null },
        data: { usedAt: new Date() },
      })
      if (!changed.count) throw httpError(400, 'Lien déjà utilisé.')
      await tx.user.update({
        where: { id: token.userId },
        data: passwordHash
          ? { passwordHash, sessionVersion: { increment: 1 } }
          : { emailVerifiedAt: new Date() },
      })
      if (passwordHash)
        await tx.refreshToken.updateMany({
          where: { userId: token.userId },
          data: { revokedAt: new Date() },
        })
    })
  },
  updateProfile: (id: string, input: { firstName: string; lastName: string; phone: string }) =>
    prisma.user.update({ where: { id }, data: input, select: publicUser }),
  async changePassword(id: string, passwordHash: string) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { passwordHash, sessionVersion: { increment: 1 } },
      }),
      prisma.refreshToken.updateMany({ where: { userId: id }, data: { revokedAt: new Date() } }),
    ])
  },
  async deleteAccount(id: string) {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id } })
      const pendingBookings = await tx.booking.findMany({
        where: { userId: id, status: 'PENDING' },
        orderBy: { activityId: 'asc' },
      })
      for (const booking of pendingBookings) {
        await tx.$queryRaw`SELECT id FROM "Activity" WHERE id = ${booking.activityId} FOR UPDATE`
        await releaseBooking(tx, booking.id, ['PENDING'])
      }
      const pendingOrders = await tx.order.findMany({ where: { userId: id, status: 'PENDING' } })
      for (const order of pendingOrders) {
        await restoreStock(tx, order.id)
        await tx.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } })
      }
      await tx.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          email: `${id}@deleted.invalid`,
          firstName: 'Compte',
          lastName: 'supprimé',
          phone: '',
          passwordHash: '',
          sessionVersion: { increment: 1 },
        },
      })
      await tx.order.updateMany({ where: { userId: id }, data: { shippingAddress: '' } })
      await tx.contactMessage.deleteMany({ where: { email: user.email } })
      await tx.newsletterSubscriber.deleteMany({ where: { email: user.email } })
      await tx.refreshToken.deleteMany({ where: { userId: id } })
      await tx.actionToken.deleteMany({ where: { userId: id } })
      await tx.cart.deleteMany({ where: { userId: id } })
      await tx.waitlist.deleteMany({ where: { userId: id } })
      await tx.notification.deleteMany({ where: { userId: id } })
    })
  },
}
