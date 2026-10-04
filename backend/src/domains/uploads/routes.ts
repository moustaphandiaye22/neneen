import { createHash } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { env } from '../../config.js'
import { requireAuth, requireStaff } from '../../middleware.js'
import { httpError } from '../../errors/httpError.js'
export const uploadRouter = Router()
uploadRouter.post('/admin/uploads/sign', requireAuth, requireStaff, (req, res) => {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET)
    throw httpError(503, 'Stockage d’images non configuré.')
  const { folder } = z.object({ folder: z.enum(['activities', 'products']) }).parse(req.body)
  const timestamp = Math.floor(Date.now() / 1000)
  const fullFolder = `neneen/${folder}`
  const signature = createHash('sha1')
    .update(`folder=${fullFolder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`)
    .digest('hex')
  res.json({
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    folder: fullFolder,
    timestamp,
    signature,
  })
})
