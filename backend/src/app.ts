import './types.js'
import cors from 'cors'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { prisma } from './lib/prisma.js'
import { env } from './config.js'
import { handleError } from './errors/handleError.js'
import { adminRouter } from './domains/admin/routes.js'
import { authRouter } from './domains/auth/routes.js'
import { catalogRouter } from './domains/catalog/routes.js'
import { customerRouter } from './domains/commerce/routes.js'
import { paymentRouter } from './domains/payments/routes.js'
import { contentRouter } from './domains/content/routes.js'
import { uploadRouter } from './domains/uploads/routes.js'

export const app = express()
app.disable('x-powered-by')
app.set('trust proxy', env.TRUST_PROXY_HOPS)
app.use((_req, res, next) => {
  res.removeHeader('Permissions-Policy')
  res.removeHeader('Feature-Policy')
  next()
})
app.use((req, res, next) => {
  const start = performance.now()
  res.on('finish', () =>
    console.info(
      JSON.stringify({
        level: 'info',
        event: 'http_request',
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Math.round(performance.now() - start),
      }),
    ),
  )
  next()
})
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'", env.FRONTEND_URL, `http://localhost:${env.PORT}`],
      },
    },
  }),
)
app.options(
  '/{*path}',
  cors({
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
)
app.use(
  cors({
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
)
app.use('/api/payments/webhook', express.urlencoded({ extended: true, limit: '32kb' }))
app.use(express.json({ limit: '1mb' }))
app.get('/api/openapi.yaml', async (_req, res) => {
  const spec = await readFile(resolve(process.cwd(), 'openapi.yaml'), 'utf8')
  res.type('application/yaml').send(spec)
})
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'neneen-api' }))
app.get('/api/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ready' })
  } catch {
    res.status(503).json({ status: 'unavailable' })
  }
})
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
)
app.use(
  '/api/contact',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
)
app.use('/api/auth', authRouter)
app.use('/api/payments', paymentRouter)
app.use('/api', contentRouter)
app.use('/api', uploadRouter)
app.use('/api', catalogRouter)
app.use('/api', customerRouter)
app.use('/api/admin', adminRouter)
app.use((_req, res) => res.status(404).json({ message: 'Route introuvable.' }))
app.use(handleError)
