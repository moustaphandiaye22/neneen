import type { Product } from '../types'

const collectionImage = '/images/products/build-different.jpg'
export const collectionDetailImage = '/images/products/build-different-detail.jpg'

// Keep images uploaded from the administration in priority.
export function withProductImage(product: Product): Product {
  if (product.imageUrl || !/^t-shirt build different$/i.test(product.name.trim())) return product
  return { ...product, imageUrl: collectionImage }
}

export function usesCollectionImage(product: Product): boolean {
  return product.imageUrl === collectionImage
}
