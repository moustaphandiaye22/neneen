import type { Commande, Reservation } from '@neneen/contracts'
import { httpError } from '../errors/httpError.js'
import * as customerRepository from '../repositories/customerRepository.js'

export async function listerReservations(userId: string) {
  return customerRepository.listBookings(userId)
}

export async function reserver(userId: string, input: Reservation) {
  const result = await customerRepository.createBooking(userId, input)
  if (result.kind === 'unavailable') throw httpError(404, 'Cette activité n’est plus disponible.')
  if (result.kind === 'full') throw httpError(409, 'Il ne reste pas assez de places.')
  return {
    booking: result.booking,
    paymentStatus: 'PENDING',
    message: 'Réservation créée. Choisissez le paiement depuis votre espace client.',
  }
}

export async function commander(userId: string, input: Commande) {
  const result = await customerRepository.createOrder(userId, input)
  return {
    order: result.order,
    paymentStatus: 'PENDING',
    message: 'Commande créée. Choisissez le paiement depuis votre espace client.',
  }
}

export async function listerCommandes(userId: string) {
  return customerRepository.listOrders(userId)
}
