import jwt from 'jsonwebtoken'
import type { Connexion, Inscription } from '@neneen/contracts'
import { env } from '../config.js'
import { httpError } from '../errors/httpError.js'
import { authRepository } from '../repositories/authRepository.js'
import { passwordProvider, type PasswordProvider } from '../providers/passwordProvider.js'
import { hashToken, newToken } from '../utils/tokens.js'

export function createAuthService(
  repository: typeof authRepository,
  passwords: PasswordProvider,
  secret: string,
  frontendUrl: string,
) {
  function safeUser(user: Awaited<ReturnType<typeof repository.createCustomer>>) {
    const { id, firstName, lastName, email, phone, role, emailVerifiedAt } = user
    return { id, firstName, lastName, email, phone, role, emailVerifiedAt }
  }
  function accessToken(user: { id: string; role: string; sessionVersion: number }) {
    return jwt.sign({ role: user.role, version: user.sessionVersion }, secret, {
      subject: user.id,
      expiresIn: '15m',
      issuer: 'neneen',
      audience: 'neneen-web',
    })
  }
  async function session(user: Awaited<ReturnType<typeof repository.createCustomer>>) {
    const refreshToken = newToken()
    await repository.saveRefresh(
      user.id,
      hashToken(refreshToken),
      new Date(Date.now() + 30 * 86400000),
    )
    return { user: safeUser(user), token: accessToken(user), refreshToken }
  }
  async function sendAction(userId: string, purpose: 'RESET' | 'VERIFY') {
    const token = newToken()
    const route = purpose === 'RESET' ? 'reset-password' : 'verify-email'
    await repository.saveAction(
      userId,
      purpose,
      hashToken(token),
      new Date(Date.now() + 3600000),
      `Ouvrez ce lien dans l’heure : ${frontendUrl}/#/${route}?token=${token}`,
    )
  }
  return {
    async creerCompte(input: Inscription) {
      if (await repository.findByEmail(input.email))
        throw httpError(409, 'Cette adresse e-mail est déjà utilisée.')
      const { password, ...profile } = input
      const user = await repository.createCustomer(profile, await passwords.hash(password))
      await sendAction(user.id, 'VERIFY')
      return session(user)
    },
    async connecter(input: Connexion) {
      const user = await repository.findByEmail(input.email)
      if (!user || !(await passwords.verify(user.passwordHash, input.password)))
        throw httpError(401, 'E-mail ou mot de passe incorrect.')
      return session(user)
    },
    async obtenirUtilisateur(id: string) {
      const user = await repository.findPublicUserById(id)
      if (!user) throw httpError(404, 'Compte introuvable.')
      return user
    },
    async refresh(token: string) {
      const refreshToken = newToken()
      const user = await repository.rotateRefresh(
        hashToken(token),
        hashToken(refreshToken),
        new Date(Date.now() + 30 * 86400000),
      )
      return { user: safeUser(user), token: accessToken(user), refreshToken }
    },
    logout: (token: string) => repository.revokeRefresh(hashToken(token)),
    async forgot(email: string) {
      const user = await repository.findByEmail(email)
      if (user) await sendAction(user.id, 'RESET')
    },
    reset: async (token: string, password: string) =>
      repository.consumeAction(hashToken(token), 'RESET', await passwords.hash(password)),
    verify: (token: string) => repository.consumeAction(hashToken(token), 'VERIFY'),
    resend: (id: string) => sendAction(id, 'VERIFY'),
    profile: repository.updateProfile,
    async changePassword(id: string, current: string, password: string) {
      const user = await repository.findById(id)
      if (!user || !(await passwords.verify(user.passwordHash, current)))
        throw httpError(400, 'Mot de passe actuel incorrect.')
      await repository.changePassword(id, await passwords.hash(password))
    },
    async remove(id: string, password: string) {
      const user = await repository.findById(id)
      if (!user || !(await passwords.verify(user.passwordHash, password)))
        throw httpError(400, 'Mot de passe incorrect.')
      await repository.deleteAccount(id)
    },
  }
}
export const authService = createAuthService(
  authRepository,
  passwordProvider,
  env.JWT_SECRET,
  env.FRONTEND_URL,
)
