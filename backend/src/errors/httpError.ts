export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
    if (!Number.isInteger(status) || status < 400 || status > 599) {
      throw new RangeError('Le statut d’une erreur HTTP doit être compris entre 400 et 599.')
    }
  }
}

export function httpError(status: number, message: string) {
  return new HttpError(status, message)
}
