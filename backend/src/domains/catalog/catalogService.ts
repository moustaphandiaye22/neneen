import type { MessageContact } from '@neneen/contracts'
import type { z } from 'zod'
import type { paginationSchema } from '@neneen/contracts'
import { httpError } from '../../errors/httpError.js'
import { catalogRepository } from './catalogRepository.js'

export const listerActivites = () => catalogRepository.listPublishedActivities()

export async function obtenirActivite(id: string) {
  const activity = await catalogRepository.findPublishedActivity(id)
  if (!activity) throw httpError(404, 'Activité introuvable.')
  return activity
}

export const listerProduits = () => catalogRepository.listActiveProducts()

export async function enregistrerMessageContact(input: MessageContact) {
  const message = await catalogRepository.createContactMessage(input)
  return { message: 'Votre message a bien été envoyé.', id: message.id }
}

export const rechercherActivites = (input: z.infer<typeof paginationSchema>) =>
  catalogRepository.searchActivities(input)
export const rechercherProduits = (input: z.infer<typeof paginationSchema>) =>
  catalogRepository.searchProducts(input)
export async function obtenirProduit(id: string) {
  const product = await catalogRepository.findProduct(id)
  if (!product) throw httpError(404, 'Produit introuvable.')
  return product
}
