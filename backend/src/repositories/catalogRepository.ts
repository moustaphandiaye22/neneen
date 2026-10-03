import { ActivityStatus } from '@prisma/client'
import type { MessageContact } from '@neneen/contracts'
import type { z } from 'zod'
import type { paginationSchema } from '@neneen/contracts'
import { prisma } from '../lib/prisma.js'

export const catalogRepository = {
  listPublishedActivities(now = new Date()) {
    return prisma.activity.findMany({
      where: { status: ActivityStatus.PUBLISHED, startsAt: { gte: now } },
      orderBy: { startsAt: 'asc' },
    })
  },

  findPublishedActivity(id: string) {
    return prisma.activity.findFirst({ where: { id, status: ActivityStatus.PUBLISHED } })
  },

  listActiveProducts() {
    return prisma.product.findMany({
      where: { active: true },
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  searchActivities(input: z.infer<typeof paginationSchema>) {
    return prisma.activity.findMany({
      where: {
        status: 'PUBLISHED',
        startsAt: { gte: new Date() },
        ...(input.type ? { type: input.type } : {}),
        ...(input.search
          ? {
              OR: [
                { title: { contains: input.search, mode: 'insensitive' } },
                { location: { contains: input.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy:
        input.sort === 'price'
          ? { price: 'asc' }
          : input.sort === 'name'
            ? { title: 'asc' }
            : { startsAt: 'asc' },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    })
  },
  searchProducts(input: z.infer<typeof paginationSchema>) {
    return prisma.product.findMany({
      where: {
        active: true,
        ...(input.search
          ? {
              OR: [
                { name: { contains: input.search, mode: 'insensitive' } },
                { color: { contains: input.search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: { variants: true },
      orderBy:
        input.sort === 'price'
          ? { price: 'asc' }
          : input.sort === 'name'
            ? { name: 'asc' }
            : { createdAt: 'desc' },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    })
  },
  findProduct(id: string) {
    return prisma.product.findFirst({ where: { id, active: true }, include: { variants: true } })
  },
  createContactMessage(input: MessageContact) {
    return prisma.contactMessage.create({ data: input })
  },
}
