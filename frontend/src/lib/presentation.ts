import { formatMoney } from '@neneen/contracts'

export const photos: Record<string, string> = {
  EXCURSION:
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=85',
  AFTERWORK:
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=85',
  EVENT:
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=85',
}
export const money = formatMoney
export const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Dakar',
  }).format(new Date(value))
export const typeLabel = (type: string) =>
  ({ EXCURSION: 'Excursion', AFTERWORK: 'Soirée après le travail', EVENT: 'Événement' })[type] ||
  type
export const stateLabel = (value: unknown) =>
  ({
    PENDING: 'En attente',
    PAID: 'Payée',
    SUCCEEDED: 'Payé',
    FAILED: 'Échec',
    REFUND_PENDING: 'Remboursement en cours',
    REFUNDED: 'Remboursé',
    CONFIRMED: 'Confirmée',
    PROCESSING: 'En préparation',
    SHIPPED: 'Expédiée',
    COMPLETED: 'Terminée',
    CANCELLED: 'Annulée',
    NEW: 'Nouveau',
    READ: 'Lu',
    REPLIED: 'Répondu',
    PUBLISHED: 'Publié',
    DRAFT: 'Brouillon',
    CUSTOMER: 'Client',
    STAFF: 'Équipe',
    ADMIN: 'Administrateur',
  })[String(value)] || String(value)

export const paymentMethodLabel = (value: string) =>
  ({ WAVE: 'Wave', ORANGE_MONEY: 'Orange Money', CARD: 'Carte bancaire', CASH: 'Espèces' })[
    value
  ] || value

export function pageTitle(route: string) {
  const titles: Record<string, string> = {
    '/': 'Accueil',
    '/activities': 'Sorties',
    '/calendar': 'Calendrier',
    '/shop': 'Boutique',
    '/cart': 'Panier',
    '/login': 'Connexion et inscription',
    '/checkout': 'Paiement',
    '/account': 'Mon compte',
    '/contact': 'Contact',
    '/about': 'À propos',
    '/faq': 'Questions fréquentes',
    '/cgv': 'Conditions de vente',
    '/mentions': 'Mentions légales',
    '/admin': 'Administration',
    '/forgot-password': 'Mot de passe oublié',
  }
  if (titles[route]) return titles[route]
  if (route.startsWith('/activity/')) return 'Détail de la sortie'
  if (route.startsWith('/booking/')) return 'Réservation'
  if (route.startsWith('/product/')) return 'Détail du produit'
  if (route.startsWith('/reset-password')) return 'Nouveau mot de passe'
  if (route.startsWith('/verify-email')) return 'Vérification de l’adresse e-mail'
  return 'Page introuvable'
}
