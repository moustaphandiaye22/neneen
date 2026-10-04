import { Router } from 'express'
import { requireAuth } from '../../middleware.js'
import { authController as controller } from './authController.js'
export const authRouter = Router()
authRouter.post('/register', controller.register)
authRouter.post('/login', controller.login)
authRouter.post('/refresh', controller.refresh)
authRouter.post('/logout', controller.logout)
authRouter.post('/forgot-password', controller.forgot)
authRouter.post('/reset-password', controller.reset)
authRouter.post('/verify-email', controller.verify)
authRouter.get('/me', requireAuth, controller.me)
authRouter.patch('/profile', requireAuth, controller.profile)
authRouter.post('/change-password', requireAuth, controller.password)
authRouter.post('/resend-verification', requireAuth, controller.resend)
authRouter.delete('/account', requireAuth, controller.remove)
