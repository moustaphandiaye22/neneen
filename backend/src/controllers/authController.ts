import type { Request, Response } from 'express'
import { z } from 'zod'
import {
  connexionSchema,
  inscriptionSchema,
  emailSchema,
  resetSchema,
  tokenSchema,
  profilSchema,
  passwordSchema,
} from '@neneen/contracts'
import { authService } from '../services/authService.js'
import { env } from '../config.js'
import { httpError } from '../errors/httpError.js'
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth',
  maxAge: 30 * 86400000,
}
function refreshCookie(req: Request) {
  const value = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('neneen_refresh='))
    ?.slice('neneen_refresh='.length)
  if (!value) throw httpError(401, 'Session expirée.')
  return value
}
function sendSession(res: Response, result: Awaited<ReturnType<typeof authService.connecter>>) {
  res.cookie('neneen_refresh', result.refreshToken, cookieOptions)
  res.json({ user: result.user, token: result.token })
}
export const authController = {
  register: async (req: Request, res: Response) =>
    sendSession(res.status(201), await authService.creerCompte(inscriptionSchema.parse(req.body))),
  login: async (req: Request, res: Response) =>
    sendSession(res, await authService.connecter(connexionSchema.parse(req.body))),
  refresh: async (req: Request, res: Response) =>
    sendSession(res, await authService.refresh(refreshCookie(req))),
  logout: async (req: Request, res: Response) => {
    const token = req.headers.cookie?.includes('neneen_refresh=') ? refreshCookie(req) : null
    if (token) await authService.logout(token)
    res.clearCookie('neneen_refresh', cookieOptions).json({ message: 'Déconnexion effectuée.' })
  },
  me: async (req: Request, res: Response) =>
    res.json({ user: await authService.obtenirUtilisateur(req.user!.id) }),
  forgot: async (req: Request, res: Response) => {
    await authService.forgot(emailSchema.parse(req.body).email)
    res.json({ message: 'Si ce compte existe, un lien de réinitialisation sera envoyé.' })
  },
  reset: async (req: Request, res: Response) => {
    const input = resetSchema.parse(req.body)
    await authService.reset(input.token, input.password)
    res.json({ message: 'Mot de passe réinitialisé. Reconnectez-vous.' })
  },
  verify: async (req: Request, res: Response) => {
    await authService.verify(tokenSchema.parse(req.body).token)
    res.json({ message: 'Adresse e-mail vérifiée.' })
  },
  resend: async (req: Request, res: Response) => {
    await authService.resend(req.user!.id)
    res.json({ message: 'Un nouveau lien sera envoyé.' })
  },
  profile: async (req: Request, res: Response) =>
    res.json({ user: await authService.profile(req.user!.id, profilSchema.parse(req.body)) }),
  password: async (req: Request, res: Response) => {
    const input = passwordSchema.parse(req.body)
    await authService.changePassword(req.user!.id, input.currentPassword, input.password)
    res.json({ message: 'Mot de passe modifié. Reconnectez-vous.' })
  },
  remove: async (req: Request, res: Response) => {
    await authService.remove(
      req.user!.id,
      z.object({ password: z.string().min(1).max(128) }).parse(req.body).password,
    )
    res.clearCookie('neneen_refresh', cookieOptions).json({ message: 'Compte supprimé.' })
  },
}
