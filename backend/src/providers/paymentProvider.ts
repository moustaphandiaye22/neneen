import { createHash, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { env } from '../config.js'
import { httpError } from '../errors/httpError.js'
export type PaymentMethod = 'WAVE' | 'ORANGE_MONEY' | 'CARD' | 'CASH'
export interface PaymentProvider {
  create(input: { id: string; amount: number }): Promise<{ reference: string; url: string | null }>
  verify(reference: string): Promise<{ status: 'SUCCEEDED' | 'FAILED' | 'PENDING'; amount: number }>
  refund(reference: string): Promise<{ completed: boolean }>
}
const checkoutSchema = z.object({
  response_code: z.literal('00'),
  token: z.string(),
  response_text: z.url(),
})
const confirmationSchema = z.object({
  response_code: z.literal('00'),
  status: z.string(),
  invoice: z.object({ total_amount: z.coerce.number().int().nonnegative() }),
  custom_data: z.object({ paymentId: z.string() }).optional(),
})
class PayDunyaProvider implements PaymentProvider {
  constructor(private readonly channel: string) {}
  private async request(path: string, body?: unknown) {
    if (
      env.PAYMENT_MODE === 'disabled' ||
      !env.PAYDUNYA_MASTER_KEY ||
      !env.PAYDUNYA_PRIVATE_KEY ||
      !env.PAYDUNYA_TOKEN
    )
      throw httpError(
        503,
        'Le paiement en ligne n’est pas encore disponible. Choisissez le paiement en espèces.',
      )
    const base =
      env.PAYMENT_MODE === 'live'
        ? 'https://app.paydunya.com/api/v1'
        : 'https://app.paydunya.com/sandbox-api/v1'
    const response = await fetch(`${base}/${path}`, {
      method: body ? 'POST' : 'GET',
      signal: AbortSignal.timeout(15000),
      headers: {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': env.PAYDUNYA_MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': env.PAYDUNYA_PRIVATE_KEY,
        'PAYDUNYA-TOKEN': env.PAYDUNYA_TOKEN,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    if (!response.ok)
      throw httpError(502, 'Le prestataire de paiement est temporairement indisponible.')
    return response.json() as Promise<unknown>
  }
  async create(input: { id: string; amount: number }) {
    const result = checkoutSchema.parse(
      await this.request('checkout-invoice/create', {
        invoice: {
          total_amount: input.amount,
          description: `neneen ${input.id}`,
          channels: [this.channel],
        },
        store: { name: 'neneen', tagline: 'Notre style, notre identité' },
        custom_data: { paymentId: input.id },
        actions: {
          return_url: `${env.PUBLIC_API_URL}/api/payments/return`,
          cancel_url: `${env.FRONTEND_URL}/#/account`,
          callback_url: `${env.PUBLIC_API_URL}/api/payments/webhook`,
        },
      }),
    )
    const url = new URL(result.response_text)
    if (url.protocol !== 'https:' || !['app.paydunya.com', 'paydunya.com'].includes(url.hostname))
      throw httpError(502, 'Lien de paiement invalide.')
    return { reference: result.token, url: result.response_text }
  }
  async verify(reference: string) {
    const result = confirmationSchema.parse(
      await this.request(`checkout-invoice/confirm/${encodeURIComponent(reference)}`),
    )
    return {
      paymentId: result.custom_data?.paymentId,
      status:
        result.status.toLowerCase() === 'completed'
          ? ('SUCCEEDED' as const)
          : ['failed', 'canceled', 'cancelled'].includes(result.status.toLowerCase())
            ? ('FAILED' as const)
            : ('PENDING' as const),
      amount: result.invoice.total_amount,
    }
  }
  async refund(_reference: string) {
    return { completed: false }
  }
}
export class WaveProvider extends PayDunyaProvider {
  constructor() {
    super('wave-senegal')
  }
}
export class OrangeMoneyProvider extends PayDunyaProvider {
  constructor() {
    super('orange-money-senegal')
  }
}
export class CardProvider extends PayDunyaProvider {
  constructor() {
    super('card')
  }
}
export class CashProvider implements PaymentProvider {
  async create(input: { id: string; amount: number }) {
    return { reference: `cash:${input.id}`, url: null }
  }
  async verify(_reference: string) {
    return { status: 'PENDING' as const, amount: 0 }
  }
  async refund(_reference: string) {
    return { completed: false }
  }
}
export const paymentProviders: Record<PaymentMethod, PaymentProvider> = {
  WAVE: new WaveProvider(),
  ORANGE_MONEY: new OrangeMoneyProvider(),
  CARD: new CardProvider(),
  CASH: new CashProvider(),
}
export function verifyPayDunyaHash(hash: string) {
  if (!env.PAYDUNYA_MASTER_KEY || !/^[a-f0-9]{128}$/i.test(hash))
    throw httpError(401, 'Signature invalide.')
  const expected = createHash('sha512').update(env.PAYDUNYA_MASTER_KEY).digest()
  if (!timingSafeEqual(expected, Buffer.from(hash, 'hex')))
    throw httpError(401, 'Signature invalide.')
}
