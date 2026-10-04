import 'dotenv/config'
import argon2 from 'argon2'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const activities = [
    {
      id: 'seed-excursion',
      type: 'EXCURSION' as const,
      title: 'Journée au Lac Rose et dunes',
      description: 'Balade en 4x4 sur les dunes, déjeuner face au lac et temps libre.',
      location: 'Place de l’Obélisque, Dakar',
      duration: 'Journée, retour vers 18 h',
      schedule: [
        '8 h : départ de Dakar',
        '9 h 30 : balade en 4x4 sur les dunes',
        '12 h 30 : déjeuner face au lac',
        '15 h : temps libre et photos',
        '16 h : retour vers Dakar',
      ],
      included: ['Transport aller-retour', 'Balade en 4x4', 'Déjeuner', 'Accompagnateur neneen'],
      bringList: 'Chapeau, lunettes de soleil, crème solaire, eau et tenue légère.',
      startsAt: new Date('2026-11-11T08:00:00+00:00'),
      price: 15000,
      capacity: 14,
      status: 'PUBLISHED' as const,
      featured: true,
    },
    {
      id: 'seed-afterwork',
      type: 'AFTERWORK' as const,
      title: 'Rencontre sur un toit-terrasse',
      description: 'Rencontres, musique et cocktails pour finir la journée ensemble.',
      location: 'Toit-terrasse, Almadies',
      duration: '3 h, de 18 h 30 à 21 h 30',
      schedule: [
        '18 h 30 : accueil et boisson de bienvenue',
        '19 h 30 : rencontres et musique',
        '21 h : dernier verre',
      ],
      included: ['Boisson de bienvenue', 'Ambiance musicale', 'Rencontres entre membres'],
      bringList: 'Tenue chic décontractée. Les boissons supplémentaires sont à votre charge.',
      startsAt: new Date('2026-11-08T18:30:00+00:00'),
      price: 5000,
      capacity: 40,
      status: 'PUBLISHED' as const,
    },
    {
      id: 'seed-event',
      type: 'EVENT' as const,
      title: 'Soirée de gala neneen',
      description: 'Dîner, animations et musique pour célébrer la communauté.',
      location: 'Dakar',
      duration: 'Soirée, de 19 h à minuit',
      schedule: ['19 h : accueil', '20 h : dîner', '22 h : concert', '23 h 30 : danse'],
      included: ['Dîner', 'Concert', 'Animations', 'Piste de danse'],
      bringList: 'Tenue de soirée.',
      startsAt: new Date('2026-12-14T19:00:00+00:00'),
      price: 25000,
      capacity: 120,
      status: 'PUBLISHED' as const,
    },
    {
      id: 'seed-saly',
      type: 'EXCURSION' as const,
      title: 'Week-end à Saly',
      description:
        'Deux jours de détente, sortie en pirogue et coucher de soleil sur la Petite Côte.',
      location: 'Parking Dakar Plateau',
      duration: '2 jours, 1 nuit',
      schedule: [
        'Jour 1 · 7 h 30 : départ de Dakar',
        '12 h : installation et déjeuner à Saly',
        '16 h : plage et détente',
        '19 h : dîner et soirée',
        'Jour 2 · 9 h : sortie en pirogue',
        '12 h : déjeuner',
        '16 h : retour à Dakar',
      ],
      included: ['Transport', 'Hébergement 1 nuit', 'Repas au programme', 'Sortie en pirogue'],
      bringList: 'Maillot de bain, serviette, crème solaire et vêtements de rechange.',
      startsAt: new Date('2026-10-24T07:30:00+00:00'),
      price: 45000,
      capacity: 8,
      status: 'PUBLISHED' as const,
    },
    {
      id: 'seed-afterwork-games',
      type: 'AFTERWORK' as const,
      title: 'Soirée jeux de société',
      description: 'Une soirée conviviale autour de jeux pour briser la glace.',
      location: 'Bar Le Dé, Mermoz',
      duration: '3 h, de 19 h à 22 h',
      schedule: ['19 h : accueil', '19 h 30 : jeux par équipes', '21 h 30 : fin de soirée'],
      included: ['Jeux fournis', 'Animateur', 'Une boisson'],
      bringList: 'Bonne humeur et envie de rencontrer du monde.',
      startsAt: new Date('2026-10-15T19:00:00+00:00'),
      price: 3000,
      capacity: 25,
      status: 'PUBLISHED' as const,
    },
  ]
  for (const { id, ...activity } of activities)
    await prisma.activity.upsert({
      where: { id },
      create: { id, ...activity },
      update: activity,
    })

  const products = [
    {
      id: 'seed-shirt-navy',
      name: 'T-shirt Build Different',
      color: 'Marine',
      description: 'T-shirt de la collection Build Different.',
      price: 10000,
      stock: 30,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    },
    {
      id: 'seed-shirt-terracotta',
      name: 'T-shirt Build Different',
      color: 'Terracotta',
      description: 'T-shirt de la collection Build Different.',
      price: 10000,
      stock: 24,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    },
    {
      id: 'seed-shirt-white',
      name: 'T-shirt Build Different',
      color: 'Blanc',
      description: 'T-shirt de la collection Build Different.',
      price: 10000,
      stock: 20,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    },
    {
      id: 'seed-shirt-grey',
      name: 'T-shirt Build Different',
      color: 'Gris',
      description: 'T-shirt de la collection Build Different.',
      price: 10000,
      stock: 18,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    },
    {
      id: 'seed-shirt-cream',
      name: 'T-shirt Build Different',
      color: 'Crème',
      description: 'T-shirt de la collection Build Different.',
      price: 10000,
      stock: 18,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    },
  ]
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: product,
      update: {
        name: product.name,
        description: product.description,
        color: product.color,
        price: product.price,
        sizes: product.sizes,
      },
    })
    const each = Math.floor(product.stock / product.sizes.length)
    for (const [index, size] of product.sizes.entries())
      await prisma.productVariant.upsert({
        where: { productId_size: { productId: product.id, size } },
        create: {
          productId: product.id,
          size,
          color: product.color,
          stock: each + (index < product.stock % product.sizes.length ? 1 : 0),
        },
        update: {},
      })
  }
  for (const [id, label] of [
    ['EXCURSION', 'Excursion'],
    ['AFTERWORK', 'Soirée après le travail'],
    ['EVENT', 'Événement'],
  ])
    await prisma.activityCategory.upsert({
      where: { id },
      create: { id, label },
      update: { label },
    })
  for (const [slug, title, body] of [
    [
      'faq',
      'Questions fréquentes',
      'Contactez-nous pour toute question sur les sorties, commandes et annulations.',
    ],
    [
      'cgv',
      'Conditions générales de vente',
      'Conditions générales à compléter avant la mise en vente.',
    ],
    ['mentions', 'Mentions légales', 'Mentions légales à compléter avant la mise en ligne.'],
    ['about', 'À propos', 'neneen rassemble la communauté à Dakar.'],
  ])
    await prisma.content.upsert({
      where: { slug },
      create: { slug, title, body, published: true },
      update: {},
    })

  const email = process.env.ADMIN_EMAIL?.toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (email && password) {
    if (password.length < 12)
      throw new Error('ADMIN_PASSWORD doit contenir au moins 12 caractères.')
    await prisma.user.upsert({
      where: { email },
      create: {
        firstName: 'Admin',
        lastName: 'neneen',
        email,
        phone: '+221770000000',
        passwordHash: await argon2.hash(password),
        role: 'ADMIN',
      },
      update: { role: 'ADMIN', passwordHash: await argon2.hash(password) },
    })
    console.info(`Compte administrateur initialisé : ${email}`)
  } else {
    console.info('ADMIN_EMAIL/PASSWORD absents : aucun compte administrateur créé.')
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
