import { prisma } from '../../lib/prisma.js'
export const contentRepository = {
  get: (slug: string) => prisma.content.findFirst({ where: { slug, published: true } }),
  list: () => prisma.content.findMany({ orderBy: { slug: 'asc' } }),
  save: (slug: string, data: { title: string; body: string; published: boolean }) =>
    prisma.content.upsert({ where: { slug }, create: { slug, ...data }, update: data }),
  subscribe: (email: string) =>
    prisma.newsletterSubscriber.upsert({ where: { email }, create: { email }, update: {} }),
  participants: (activityId: string) =>
    prisma.booking.findMany({
      where: { activityId, status: { in: ['CONFIRMED', 'PENDING'] } },
      include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  async checkIn(ticketSecret: string, actorId: string) {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { ticketSecret },
        include: { activity: true },
      })
      if (
        !booking ||
        (booking.status !== 'CONFIRMED' &&
          !(booking.status === 'PENDING' && booking.paymentMethod === 'CASH'))
      )
        return { kind: 'invalid' as const }
      const now = Date.now()
      if (Math.abs(booking.activity.startsAt.getTime() - now) > 24 * 3600000)
        return { kind: 'wrongDay' as const }
      const changed = await tx.booking.updateMany({
        where: { id: booking.id, checkedInAt: null },
        data: { checkedInAt: new Date() },
      })
      if (!changed.count) return { kind: 'alreadyUsed' as const }
      await tx.auditLog.create({ data: { actorId, action: 'CHECK_IN', targetId: booking.id } })
      return { kind: 'checkedIn' as const, booking }
    })
  },
}
