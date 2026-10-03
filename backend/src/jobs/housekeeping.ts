import { prisma } from '../lib/prisma.js'
import { releaseBooking, enqueueNotification } from '../repositories/transactionHelpers.js'
import { notificationService } from '../services/notificationService.js'
export async function releaseExpiredBookings() {
  const expired = await prisma.booking.findMany({
    where: { status: 'PENDING', expiresAt: { lte: new Date() } },
    select: { id: true, activityId: true },
    take: 100,
  })
  for (const item of expired)
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Activity" WHERE id = ${item.activityId} FOR UPDATE`
      await releaseBooking(tx, item.id, ['PENDING'])
    })
  return expired.length
}
export async function notifyWaitlist() {
  const entries = await prisma.waitlist.findMany({
    where: {
      notifiedAt: null,
      activity: { status: 'PUBLISHED', startsAt: { gt: new Date() }, reserved: { gte: 0 } },
    },
    include: { activity: true },
    take: 100,
    orderBy: { createdAt: 'asc' },
  })
  for (const entry of entries) {
    if (entry.activity.reserved >= entry.activity.capacity) continue
    await prisma.$transaction(async (tx) => {
      const changed = await tx.waitlist.updateMany({
        where: { id: entry.id, notifiedAt: null },
        data: { notifiedAt: new Date() },
      })
      if (changed.count)
        await enqueueNotification(
          tx,
          entry.userId,
          `waitlist:${entry.id}`,
          'Une place est disponible',
          `Une place s’est libérée pour ${entry.activity.title}. Réservez dès maintenant.`,
        )
    })
  }
}
export async function remindActivities() {
  const now = new Date()
  const soon = new Date(now.getTime() + 24 * 3600000)
  const bookings = await prisma.booking.findMany({
    where: { status: 'CONFIRMED', activity: { startsAt: { gt: now, lte: soon } } },
    include: { activity: true },
    take: 200,
  })
  for (const booking of bookings)
    await prisma.$transaction((tx) =>
      enqueueNotification(
        tx,
        booking.userId,
        `reminder:${booking.id}`,
        'Votre activité approche',
        `${booking.activity.title} commence bientôt. Rendez-vous à ${booking.activity.location}.`,
      ),
    )
}
export async function runHousekeeping() {
  await releaseExpiredBookings()
  await notifyWaitlist()
  await remindActivities()
  await notificationService.dispatch()
}
