import { Router } from 'express'
import { z } from 'zod'
import {
  activiteSchema,
  etatCommandeSchema,
  etatMessageSchema,
  etatReservationSchema,
  produitSchema,
  variantSchema,
} from '@neneen/contracts'
import { requireStaff, requireAdmin, requireAuth } from '../middleware.js'
import * as adminService from '../services/adminService.js'
import { auditRepository } from '../repositories/auditRepository.js'

export const adminRouter = Router()
adminRouter.use(requireAuth, requireStaff)
adminRouter.use((req, res, next) => {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) return next()
  res.on('finish', () => {
    if (res.statusCode < 400 && req.user)
      void auditRepository
        .record(req.user.id, `${req.method} ${req.route?.path ?? req.path}`)
        .catch(() => console.error(JSON.stringify({ level: 'error', event: 'audit_failed' })))
  })
  next()
})

adminRouter.get('/audit-logs', requireAdmin, async (_req, res) =>
  res.json({ logs: await auditRepository.list() }),
)
adminRouter.get('/dashboard', async (_req, res) =>
  res.json(await adminService.obtenirTableauDeBord()),
)

adminRouter.get('/activities', async (_req, res) =>
  res.json({ activities: await adminService.listerActivites() }),
)
adminRouter.post('/activities', async (req, res) =>
  res
    .status(201)
    .json({ activity: await adminService.creerActivite(activiteSchema.parse(req.body)) }),
)
adminRouter.patch('/activities/:id', async (req, res) => {
  const input = activiteSchema.partial().parse(req.body)
  res.json({ activity: await adminService.modifierActivite(req.params.id, input) })
})
adminRouter.delete('/activities/:id', async (req, res) => {
  res.json({ activity: await adminService.annulerActivite(req.params.id) })
})

adminRouter.get('/products', async (_req, res) =>
  res.json({ products: await adminService.listerProduits() }),
)
adminRouter.post('/products', async (req, res) =>
  res.status(201).json({ product: await adminService.creerProduit(produitSchema.parse(req.body)) }),
)
adminRouter.patch('/products/:id', async (req, res) => {
  const input = produitSchema.partial().parse(req.body)
  res.json({ product: await adminService.modifierProduit(req.params.id, input) })
})
adminRouter.delete('/products/:id', async (req, res) => {
  res.json({ product: await adminService.masquerProduit(req.params.id) })
})

adminRouter.put('/products/:id/variants', async (req, res) => {
  const input = variantSchema.parse(req.body)
  res.json({
    variant: await adminService.modifierStockVariante(req.params.id, input.size, input.stock),
  })
})

adminRouter.get('/customers', async (_req, res) => {
  const customers = await adminService.listerClients()
  res.json({ customers })
})

adminRouter.patch('/customers/:id/role', requireAdmin, async (req, res) => {
  const { role } = z.object({ role: z.enum(['CUSTOMER', 'STAFF', 'ADMIN']) }).parse(req.body)
  res.json({
    user: await adminService.changerRole(req.user!.id, z.string().parse(req.params.id), role),
  })
})

adminRouter.get('/bookings', async (_req, res) =>
  res.json({ bookings: await adminService.listerReservations() }),
)
adminRouter.patch('/bookings/:id', async (req, res) => {
  const { status } = etatReservationSchema.parse(req.body)
  const booking = await adminService.changerEtatReservation(req.params.id, status)
  res.json({ booking })
})

adminRouter.get('/payments', async (_req, res) =>
  res.json({ payments: await adminService.listerPaiements() }),
)
adminRouter.get('/orders', async (_req, res) =>
  res.json({ orders: await adminService.listerCommandes() }),
)
adminRouter.patch('/orders/:id', async (req, res) => {
  const { status } = etatCommandeSchema.parse(req.body)
  const order = await adminService.changerEtatCommande(req.params.id, status)
  res.json({ order })
})

adminRouter.get('/messages', async (_req, res) =>
  res.json({ messages: await adminService.listerMessages() }),
)
adminRouter.patch('/messages/:id', async (req, res) => {
  const { status } = etatMessageSchema.parse(req.body)
  res.json({ message: await adminService.changerEtatMessage(req.params.id, status) })
})
