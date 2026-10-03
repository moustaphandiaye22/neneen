import { Router } from 'express'
import { commandeSchema, reservationSchema } from '@neneen/contracts'
import { requireAuth } from '../middleware.js'
import * as customerService from '../services/customerService.js'
import * as customerRepository from '../repositories/customerRepository.js'
import { cartSchema } from '@neneen/contracts'
import { httpError } from '../errors/httpError.js'
import QRCode from 'qrcode'

export const customerRouter = Router()
customerRouter.use(requireAuth)

customerRouter.get('/bookings', async (req, res) => {
  const bookings = await customerService.listerReservations(req.user!.id)
  res.json({ bookings })
})

customerRouter.post('/bookings', async (req, res) => {
  const input = reservationSchema.parse(req.body)
  res.status(201).json(await customerService.reserver(req.user!.id, input))
})

customerRouter.post('/orders', async (req, res) => {
  const input = commandeSchema.parse(req.body)
  res.status(201).json(await customerService.commander(req.user!.id, input))
})

customerRouter.get('/orders', async (req, res) => {
  const orders = await customerService.listerCommandes(req.user!.id)
  res.json({ orders })
})

customerRouter.post('/bookings/:id/cancel', async (req, res) =>
  res.json({ booking: await customerRepository.cancelBooking(req.user!.id, req.params.id) }),
)
customerRouter.post('/activities/:id/waitlist', async (req, res) =>
  res
    .status(201)
    .json({ entry: await customerRepository.joinWaitlist(req.user!.id, req.params.id) }),
)
customerRouter.get('/bookings/:id/ticket', async (req, res) => {
  const booking = await customerRepository.getTicket(req.user!.id, req.params.id)
  if (!booking) throw httpError(404, 'Billet introuvable.')
  const qr = await QRCode.toDataURL(booking.ticketSecret, { margin: 1, width: 300 })
  res.json({ booking, qr })
})
customerRouter.get('/cart', async (req, res) =>
  res.json({ cart: await customerRepository.getCart(req.user!.id) }),
)
customerRouter.put('/cart', async (req, res) =>
  res.json({
    cart: await customerRepository.saveCart(req.user!.id, cartSchema.parse(req.body).items, false),
  }),
)
customerRouter.post('/cart/merge', async (req, res) =>
  res.json({
    cart: await customerRepository.saveCart(req.user!.id, cartSchema.parse(req.body).items, true),
  }),
)
