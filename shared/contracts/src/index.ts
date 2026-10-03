import { z } from 'zod'

const requiredText = (label: string, minimum = 2, maximum = 160) =>
  z
    .string()
    .trim()
    .min(minimum, {
      error: `${label} : saisissez au moins ${minimum === 1 ? 'un caractère' : `${minimum} caractères`}.`,
    })
    .max(maximum, { error: `${label} : ${maximum} caractères maximum.` })

const emailAddress = z.email({
  error: 'Adresse e-mail invalide. Exemple attendu : nom@exemple.com.',
})
const phoneNumber = z
  .string()
  .trim()
  .min(9, { error: 'Numéro de téléphone incomplet. Indiquez au moins 9 chiffres.' })
  .max(30, { error: 'Numéro de téléphone trop long.' })
const paymentMethod = z.enum(['WAVE', 'ORANGE_MONEY', 'CARD', 'CASH'], {
  error: 'Choisissez un moyen de paiement valide.',
})

export const connexionSchema = z.object({
  email: emailAddress.transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(6, { error: 'Mot de passe trop court. Il doit contenir au moins 6 caractères.' })
    .max(128, { error: 'Mot de passe trop long.' }),
})

export const inscriptionSchema = connexionSchema.extend({
  firstName: requiredText('Prénom', 1, 80),
  lastName: requiredText('Nom', 1, 80),
  phone: phoneNumber,
})

export const activiteSchema = z.object({
  featured: z.boolean().default(false),
  gallery: z.array(z.url()).max(12).default([]),
  type: z.enum(['EXCURSION', 'AFTERWORK', 'EVENT'], { error: 'Choisissez un type d’activité.' }),
  title: requiredText('Nom de l’activité', 3),
  description: requiredText('Description', 10, 5000),
  location: requiredText('Lieu', 2, 200),
  duration: z
    .string()
    .trim()
    .max(100, { error: 'La durée ne peut pas dépasser 100 caractères.' })
    .optional(),
  schedule: z
    .array(z.string().trim().min(1, { error: 'Une étape de programme ne peut pas être vide.' }))
    .max(30, { error: 'Le programme ne peut pas dépasser 30 étapes.' })
    .default([]),
  included: z
    .array(z.string().trim().min(1, { error: 'Un élément inclus ne peut pas être vide.' }))
    .max(30, { error: 'La liste ne peut pas dépasser 30 éléments.' })
    .default([]),
  bringList: z
    .string()
    .trim()
    .max(1000, { error: 'La liste à prévoir ne peut pas dépasser 1 000 caractères.' })
    .optional(),
  startsAt: z
    .string()
    .min(1, { error: 'Choisissez la date et l’heure de l’activité.' })
    .transform((value) => new Date(value))
    .refine((value) => !Number.isNaN(value.getTime()), {
      error: 'La date de l’activité est invalide.',
    }),
  endsAt: z
    .string()
    .optional()
    .transform((value) => (value ? new Date(value) : undefined)),
  price: z
    .number({ error: 'Saisissez un prix valide.' })
    .int({ error: 'Le prix doit être un nombre entier.' })
    .nonnegative({ error: 'Le prix ne peut pas être négatif.' }),
  capacity: z
    .number({ error: 'Saisissez une capacité valide.' })
    .int({ error: 'La capacité doit être un nombre entier.' })
    .positive({ error: 'La capacité doit être supérieure à zéro.' }),
  imageUrl: z
    .union([z.url({ error: 'L’adresse de la photo doit être une URL valide.' }), z.literal('')])
    .optional(),
  status: z
    .enum(['DRAFT', 'PUBLISHED', 'CANCELLED'], {
      error: 'Choisissez un état de publication valide.',
    })
    .default('DRAFT'),
})

export const produitSchema = z.object({
  name: requiredText('Nom du produit', 2),
  description: requiredText('Description du produit', 5, 3000),
  color: requiredText('Couleur', 2, 60),
  price: z
    .number({ error: 'Saisissez un prix valide.' })
    .int()
    .positive({ error: 'Le prix doit être supérieur à zéro.' }),
  stock: z
    .number({ error: 'Saisissez une quantité en stock valide.' })
    .int()
    .nonnegative({ error: 'Le stock ne peut pas être négatif.' }),
  sizes: z
    .array(
      z.string().trim().min(1, { error: 'Chaque taille doit contenir au moins un caractère.' }),
    )
    .min(1, { error: 'Ajoutez au moins une taille, séparées par des virgules.' }),
  imageUrl: z
    .union([z.url({ error: 'L’adresse de la photo doit être une URL valide.' }), z.literal('')])
    .optional(),
  active: z.boolean().default(true),
})

export const reservationSchema = z.object({
  activityId: z
    .string()
    .min(1, { error: 'Activité introuvable. Revenez au calendrier et choisissez une sortie.' }),
  quantity: z
    .number({ error: 'Choisissez un nombre de places valide.' })
    .int()
    .positive({ error: 'Réservez au moins une place.' })
    .max(10000),
  paymentMethod,
})

export const commandeSchema = z.object({
  shippingAddress: z
    .string()
    .trim()
    .min(5, { error: 'Indiquez une adresse ou une consigne de retrait (5 caractères minimum).' })
    .max(500, { error: 'L’adresse ne peut pas dépasser 500 caractères.' }),
  paymentMethod,
  shippingFee: z
    .number({ error: 'Choisissez un mode de livraison.' })
    .int()
    .refine((value) => [0, 2000, 4000].includes(value), {
      error: 'Choisissez l’un des modes de livraison proposés.',
    }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, { error: 'Un produit du panier est invalide.' }),
        size: z
          .string()
          .trim()
          .min(1, { error: 'Choisissez une taille pour chaque produit.' })
          .max(10),
        quantity: z
          .number()
          .int()
          .positive({ error: 'La quantité de chaque produit doit être supérieure à zéro.' })
          .max(20, { error: 'La quantité maximale est de 20 exemplaires par référence.' }),
      }),
    )
    .min(1, { error: 'Votre panier est vide.' })
    .max(30, { error: 'Votre panier contient trop de références.' }),
})

export const messageContactSchema = z.object({
  name: requiredText('Nom', 2),
  email: emailAddress,
  message: requiredText('Message', 10, 5000),
})

export const etatReservationSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED'], {
    error: 'Choisissez un état de réservation valide.',
  }),
})
export const etatCommandeSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'], {
    error: 'Choisissez un état de commande valide.',
  }),
})
export const etatMessageSchema = z.object({
  status: z.enum(['NEW', 'READ', 'REPLIED'], { error: 'Choisissez un état de message valide.' }),
})

export function formaterErreurs(error: z.ZodError): string {
  return [...new Set(error.issues.map((issue) => issue.message))].join('\n')
}

export type Connexion = z.infer<typeof connexionSchema>
export type Inscription = z.infer<typeof inscriptionSchema>
export type Activite = z.infer<typeof activiteSchema>
export type Produit = z.infer<typeof produitSchema>
export type Reservation = z.infer<typeof reservationSchema>
export type Commande = z.infer<typeof commandeSchema>
export type MessageContact = z.infer<typeof messageContactSchema>
export type EtatReservation = z.infer<typeof etatReservationSchema>
export type EtatCommande = z.infer<typeof etatCommandeSchema>
export type EtatMessage = z.infer<typeof etatMessageSchema>

export const profilSchema = inscriptionSchema.omit({ password: true, email: true })
export const emailSchema = z.object({
  email: emailAddress.transform((value) => value.toLowerCase()),
})
export const tokenSchema = z.object({ token: z.string().min(20).max(256) })
export const resetSchema = tokenSchema.extend({ password: connexionSchema.shape.password })
export const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  password: connexionSchema.shape.password,
})
export const cartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        size: z.enum(['S', 'M', 'L', 'XL', 'XXL']),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .max(30),
})
export const variantSchema = z.object({
  size: z.enum(['S', 'M', 'L', 'XL', 'XXL']),
  color: requiredText('Couleur', 1, 60),
  stock: z.number().int().nonnegative().max(100000),
})
export const contentSchema = z.object({
  title: requiredText('Titre', 1),
  body: requiredText('Contenu', 1, 50000),
  published: z.boolean(),
})
export const paymentSchema = z
  .object({
    bookingId: z.string().optional(),
    orderId: z.string().optional(),
    method: paymentMethod,
    idempotencyKey: z.string().uuid(),
  })
  .refine((value) => Boolean(value.bookingId) !== Boolean(value.orderId), {
    message: 'Choisissez une réservation ou une commande.',
  })
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().max(100).default(''),
  type: z.enum(['EXCURSION', 'AFTERWORK', 'EVENT']).optional(),
  sort: z.enum(['date', 'price', 'name']).default('date'),
})
export function formatMoney(amount: number) {
  return `${new Intl.NumberFormat('fr-FR').format(amount).replace(/\u202f|\u00a0/g, ' ')} FCFA`
}
export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Africa/Dakar' }).format(
    new Date(value),
  )
}
