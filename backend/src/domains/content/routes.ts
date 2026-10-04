import { Router } from 'express'
import { z } from 'zod'
import { contentSchema, emailSchema } from '@neneen/contracts'
import { requireAuth, requireStaff } from '../../middleware.js'
import { contentService } from './contentService.js'
export const contentRouter = Router()
contentRouter.get('/content/:slug', async (req, res) =>
  res.json({ content: await contentService.get(z.string().max(80).parse(req.params.slug)) }),
)
contentRouter.post('/newsletter', async (req, res) => {
  await contentService.subscribe(emailSchema.parse(req.body).email)
  res.status(201).json({ message: 'Inscription enregistrée.' })
})
contentRouter.get('/admin/content', requireAuth, requireStaff, async (_req, res) =>
  res.json({ contents: await contentService.list() }),
)
contentRouter.put('/admin/content/:slug', requireAuth, requireStaff, async (req, res) =>
  res.json({
    content: await contentService.save(
      z
        .string()
        .regex(/^[a-z0-9-]{2,80}$/)
        .parse(req.params.slug),
      contentSchema.parse(req.body),
    ),
  }),
)
contentRouter.get(
  '/admin/activities/:id/participants.csv',
  requireAuth,
  requireStaff,
  async (req, res) => {
    const rows = await contentService.participants(z.string().parse(req.params.id))
    const escape = (value: string | number) =>
      `"${String(value)
        .replace(/^[=+@-]/, "'$&")
        .replace(/"/g, '""')}"`
    res
      .type('text/csv; charset=utf-8')
      .attachment('participants.csv')
      .send(
        '\uFEFF' +
          [
            ['Référence', 'Prénom', 'Nom', 'E-mail', 'Téléphone', 'Places', 'Statut'],
            ...rows.map((row) => [
              row.reference,
              row.user.firstName,
              row.user.lastName,
              row.user.email,
              row.user.phone,
              row.quantity,
              row.status,
            ]),
          ]
            .map((row) => row.map(escape).join(';'))
            .join('\r\n'),
      )
  },
)
contentRouter.post('/admin/check-in', requireAuth, requireStaff, async (req, res) =>
  res.json({
    booking: await contentService.checkIn(
      z.object({ secret: z.string().uuid() }).parse(req.body).secret,
      req.user!.id,
    ),
  }),
)
