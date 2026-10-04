import { z } from 'zod'

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
    PAYMENT_MODE: z.enum(['disabled', 'sandbox', 'live']).default('disabled'),
    PAYDUNYA_MASTER_KEY: z.string().optional(),
    PAYDUNYA_PRIVATE_KEY: z.string().optional(),
    PAYDUNYA_TOKEN: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default('neneen <contact@neneen.sn>'),
    WHATSAPP_TOKEN: z.string().optional(),
    WHATSAPP_PHONE_ID: z.string().optional(),
    WHATSAPP_TEMPLATE: z.string().default('neneen_notification'),
    WHATSAPP_API_VERSION: z.string().default('v23.0'),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    BOOKING_HOLD_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (value) => ['postgresql:', 'postgres:'].includes(new URL(value).protocol),
        'Une URL PostgreSQL est requise.',
      ),
    JWT_SECRET: z.string().min(32),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    FRONTEND_URL: z
      .string()
      .url()
      .refine(
        (value) => ['http:', 'https:'].includes(new URL(value).protocol),
        'Une URL HTTP ou HTTPS est requise.',
      )
      .default('http://localhost:5173'),
  })
  .superRefine((value, context) => {
    if (
      value.PAYMENT_MODE !== 'disabled' &&
      ![value.PAYDUNYA_MASTER_KEY, value.PAYDUNYA_PRIVATE_KEY, value.PAYDUNYA_TOKEN].every(Boolean)
    )
      context.addIssue({
        code: 'custom',
        path: ['PAYMENT_MODE'],
        message: 'Clés PayDunya requises.',
      })
    if (
      value.PAYMENT_MODE === 'live' &&
      (!value.PUBLIC_API_URL.startsWith('https://') || !value.FRONTEND_URL.startsWith('https://'))
    )
      context.addIssue({
        code: 'custom',
        path: ['PUBLIC_API_URL'],
        message: 'HTTPS requis pour le paiement réel.',
      })
  })

export function parseEnvironment(input: Record<string, string | undefined>) {
  const result = environmentSchema.safeParse(input)
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))]
    throw new Error(`Configuration invalide : ${fields.join(', ')}.`)
  }
  return result.data
}
