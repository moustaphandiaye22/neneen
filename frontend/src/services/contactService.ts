import { messageContactSchema } from '@neneen/contracts'
import { api } from './api'
import { validerAvec } from './validation'

export function envoyerMessage(input: unknown) {
  const message = validerAvec(messageContactSchema, input)
  return api<{ message: string; id: string }>('/contact', null, {
    method: 'POST',
    body: JSON.stringify(message),
  })
}
