import { env } from '../../config.js'
import { httpError } from '../../errors/httpError.js'
export interface NotificationProvider {
  send(input: { recipient: string; subject: string; body: string }): Promise<void>
}
export class EmailProvider implements NotificationProvider {
  async send(input: { recipient: string; subject: string; body: string }) {
    if (!env.RESEND_API_KEY) throw httpError(503, 'Service e-mail non configuré.')
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [input.recipient],
        subject: input.subject,
        text: input.body,
      }),
    })
    if (!response.ok) throw httpError(502, 'Envoi e-mail temporairement indisponible.')
  }
}
export class WhatsAppProvider implements NotificationProvider {
  async send(input: { recipient: string; subject: string; body: string }) {
    if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID)
      throw httpError(503, 'Service WhatsApp non configuré.')
    const response = await fetch(
      `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${encodeURIComponent(env.WHATSAPP_PHONE_ID)}/messages`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: input.recipient.replace(/\D/g, ''),
          type: 'template',
          template: {
            name: env.WHATSAPP_TEMPLATE,
            language: { code: 'fr' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: `${input.subject} : ${input.body}`.slice(0, 1024) },
                ],
              },
            ],
          },
        }),
      },
    )
    if (!response.ok) throw httpError(502, 'Envoi WhatsApp temporairement indisponible.')
  }
}
export const notificationProviders: Record<string, NotificationProvider> = {
  EMAIL: new EmailProvider(),
  WHATSAPP: new WhatsAppProvider(),
}
