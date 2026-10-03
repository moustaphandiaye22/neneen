import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { HttpError } from './httpError.js'

export function handleError(error: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(error)
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: 'Données invalides.', issues: error.issues })
  }
  if (error instanceof HttpError && error.status < 500) {
    return res.status(error.status).json({ message: error.message })
  }
  if (error instanceof Error && 'type' in error) {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ message: 'Corps JSON invalide.' })
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ message: 'Requête trop volumineuse.' })
    }
  }
  console.error(JSON.stringify({ level: 'error', event: 'request_failed' }))
  return res
    .status(error instanceof HttpError ? error.status : 500)
    .json({ message: 'Erreur interne du serveur.' })
}
