import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { Role } from '@prisma/client'
import { env } from './config.js'
import { authRepository } from './repositories/authRepository.js'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const match = req.headers.authorization?.match(/^Bearer (\S+)$/)
  if (!match) return res.status(401).json({ message: 'Connexion requise.' })
  let payload: jwt.JwtPayload | string
  try {
    payload = jwt.verify(match[1], env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'neneen',
      audience: 'neneen-web',
    })
  } catch {
    return res.status(401).json({ message: 'Session expirée ou invalide.' })
  }
  if (typeof payload === 'string' || !payload.sub)
    return res.status(401).json({ message: 'Session invalide.' })
  const user = await authRepository.findById(payload.sub)
  if (!user || user.sessionVersion !== payload.version)
    return res.status(401).json({ message: 'Session révoquée.' })
  req.user = { id: user.id, role: user.role }
  next()
}
export function requireRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role))
      return res.status(403).json({ message: 'Accès non autorisé.' })
    next()
  }
}
export const requireAdmin = requireRoles(Role.ADMIN)
export const requireStaff = requireRoles(Role.ADMIN, Role.STAFF)
