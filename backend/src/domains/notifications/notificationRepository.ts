import { prisma } from '../../lib/prisma.js'
export const notificationRepository = {
  async claim() {
    return prisma.$transaction(async (tx) => {
      const selected = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM "Notification" WHERE status IN ('PENDING', 'RETRY') AND "availableAt" <= NOW() ORDER BY "createdAt" LIMIT 20 FOR UPDATE SKIP LOCKED`
      if (!selected.length) return []
      await tx.notification.updateMany({
        where: { id: { in: selected.map((item) => item.id) } },
        data: { status: 'PROCESSING', attempts: { increment: 1 } },
      })
      return tx.notification.findMany({ where: { id: { in: selected.map((item) => item.id) } } })
    })
  },
  sent: (id: string) =>
    prisma.notification.update({ where: { id }, data: { status: 'SENT', sentAt: new Date() } }),
  retry: (id: string, attempts: number) =>
    prisma.notification.update({
      where: { id },
      data: {
        status: attempts >= 6 ? 'FAILED' : 'RETRY',
        availableAt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** attempts)),
      },
    }),
  releaseStuck: () =>
    prisma.notification.updateMany({
      where: { status: 'PROCESSING', availableAt: { lt: new Date(Date.now() - 10 * 60000) } },
      data: { status: 'RETRY' },
    }),
}
