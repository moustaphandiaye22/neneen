import type { Prisma } from '@prisma/client'
import type { Activite, Produit } from '@neneen/contracts'
import { httpError } from '../../errors/httpError.js'
import { adminRepository } from './adminRepository.js'

export const obtenirTableauDeBord = () => adminRepository.getDashboard()
export const listerActivites = () => adminRepository.listActivities()
export const listerProduits = () => adminRepository.listProducts()
export const listerClients = () => adminRepository.listCustomers()
export const listerReservations = () => adminRepository.listBookings()
export const listerCommandes = () => adminRepository.listOrders()
export const listerMessages = () => adminRepository.listMessages()
export const creerActivite = (input: Activite) => adminRepository.createActivity(input)
export const creerProduit = (input: Produit) => adminRepository.createProduct(input)

export const modifierActivite = (id: string, input: Prisma.ActivityUpdateInput) =>
  adminRepository.updateActivity(id, input)

export async function annulerActivite(id: string) {
  if (!(await adminRepository.findActivity(id))) throw httpError(404, 'Activité introuvable.')
  return adminRepository.cancelActivity(id)
}

export async function modifierProduit(id: string, input: Prisma.ProductUpdateInput) {
  try {
    const { stock: _stock, sizes: _sizes, ...details } = input
    return await adminRepository.updateProduct(id, details)
  } catch {
    throw httpError(404, 'Produit introuvable.')
  }
}

export async function masquerProduit(id: string) {
  try {
    return await adminRepository.hideProduct(id)
  } catch {
    throw httpError(404, 'Produit introuvable.')
  }
}

export async function changerEtatReservation(
  id: string,
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED',
) {
  const result = await adminRepository.setBookingStatus(id, status)
  if (result.kind === 'notFound') throw httpError(404, 'Réservation introuvable.')
  if (result.kind === 'statusChanged')
    throw httpError(409, 'Cette réservation vient d’être modifiée. Actualisez la page.')
  return result.booking
}

export async function changerEtatCommande(
  id: string,
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED',
) {
  const result = await adminRepository.setOrderStatus(id, status)
  if (result.kind === 'notFound') throw httpError(404, 'Commande introuvable.')
  return result.order
}

export async function changerEtatMessage(id: string, status: 'NEW' | 'READ' | 'REPLIED') {
  try {
    return await adminRepository.setMessageStatus(id, status)
  } catch {
    throw httpError(404, 'Message introuvable.')
  }
}

export const modifierStockVariante = (productId: string, size: string, stock: number) =>
  adminRepository.setVariantStock(productId, size, stock)

export const changerRole = (actorId: string, id: string, role: 'CUSTOMER' | 'STAFF' | 'ADMIN') =>
  adminRepository.changeRole(actorId, id, role)

export const listerPaiements = () => adminRepository.listPayments()
export const listerOptionsProduit = () => adminRepository.listProductOptions()
export const obtenirParametres = () => adminRepository.getSiteSettings()
export const modifierParametres = (input: Prisma.SiteSettingsUpdateInput) =>
  adminRepository.updateSiteSettings(input)
