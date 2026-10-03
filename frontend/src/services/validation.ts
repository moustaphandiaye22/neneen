import { formaterErreurs } from '@neneen/contracts'
import { ZodError, type ZodType } from 'zod'

export function validerAvec<T>(schema: ZodType<T>, value: unknown): T {
  try {
    return schema.parse(value)
  } catch (reason) {
    if (reason instanceof ZodError) throw new Error(formaterErreurs(reason))
    throw reason
  }
}
