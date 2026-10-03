import { Router } from 'express'
import { messageContactSchema, paginationSchema } from '@neneen/contracts'
import * as catalogService from '../services/catalogService.js'

export const catalogRouter = Router()

catalogRouter.get('/activities/search', async (req, res) =>
  res.json({
    activities: await catalogService.rechercherActivites(paginationSchema.parse(req.query)),
  }),
)
catalogRouter.get('/products/search', async (req, res) =>
  res.json({
    products: await catalogService.rechercherProduits(paginationSchema.parse(req.query)),
  }),
)
catalogRouter.get('/products/:id', async (req, res) =>
  res.json({ product: await catalogService.obtenirProduit(req.params.id) }),
)
catalogRouter.get('/activities', async (_req, res) => {
  const activities = await catalogService.listerActivites()
  res.json({ activities })
})

catalogRouter.get('/activities/:id', async (req, res) => {
  const activity = await catalogService.obtenirActivite(req.params.id)
  res.json({ activity })
})

catalogRouter.get('/products', async (_req, res) => {
  const products = await catalogService.listerProduits()
  res.json({ products })
})

catalogRouter.post('/contact', async (req, res) => {
  const input = messageContactSchema.parse(req.body)
  res.status(201).json(await catalogService.enregistrerMessageContact(input))
})
