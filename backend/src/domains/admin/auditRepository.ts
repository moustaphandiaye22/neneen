import { prisma } from '../../lib/prisma.js'
export const auditRepository = {
  record(actorId: string, action: string, targetId?: string) {
    return prisma.auditLog.create({ data: { actorId, action, targetId } })
  },
  list(limit = 100) {
    return prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit })
  },
}
