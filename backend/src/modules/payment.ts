import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config.js'
import { paymentSchema } from '@neneen/contracts'
import { requireAuth, requireStaff } from '../middleware.js'
import { paymentService } from '../services/paymentService.js'
import { verifyPayDunyaHash } from '../providers/paymentProvider.js'
import { createReceipt } from '../services/receiptService.js'
export const paymentRouter = Router()
paymentRouter.get('/config', (_req, res) =>
  res.json({
    enabled:
      env.PAYMENT_MODE !== 'disabled' &&
      Boolean(env.PAYDUNYA_MASTER_KEY && env.PAYDUNYA_PRIVATE_KEY && env.PAYDUNYA_TOKEN),
  }),
)
paymentRouter.get('/return', async (req, res) => {
  const token = z.string().min(1).parse(req.query.token)
  await paymentService.synchronize(token)
  res.redirect(`${env.FRONTEND_URL}/#/account`)
})
paymentRouter.post('/webhook', async (req, res) => {
  const data = req.body?.data
  const input = z
    .object({ hash: z.string(), invoice: z.object({ token: z.string().min(1) }) })
    .parse(data)
  verifyPayDunyaHash(input.hash)
  await paymentService.synchronize(input.invoice.token)
  res.json({ ok: true })
})
paymentRouter.use(requireAuth)
paymentRouter.get('/', async (req, res) =>
  res.json({ payments: await paymentService.list(req.user!.id) }),
)
paymentRouter.post('/', async (req, res) =>
  res
    .status(201)
    .json({ payment: await paymentService.initiate(req.user!.id, paymentSchema.parse(req.body)) }),
)
paymentRouter.get('/:id/receipt.pdf', async (req, res) => {
  const pdf = await createReceipt(req.user!.id, z.string().parse(req.params.id))
  res.type('application/pdf').attachment('recu-neneen.pdf').send(pdf)
})
paymentRouter.get('/:id', async (req, res) =>
  res.json({ payment: await paymentService.get(req.user!.id, z.string().parse(req.params.id)) }),
)
paymentRouter.post('/:id/confirm-cash', requireStaff, async (req, res) =>
  res.json({ payment: await paymentService.confirmCash(z.string().parse(req.params.id)) }),
)
paymentRouter.post('/:id/confirm-refund', requireStaff, async (req, res) => {
  const reference = z.object({ reference: z.string().min(3).max(160) }).parse(req.body).reference
  res.json({
    payment: await paymentService.confirmRefund(
      z.string().parse(req.params.id),
      req.user!.id,
      reference,
    ),
  })
})
