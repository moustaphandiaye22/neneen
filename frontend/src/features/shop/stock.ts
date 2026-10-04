import type { Product } from '../../types'

export function stockForSize(product: Product, size: string) {
  return product.variants?.find((variant) => variant.size === size)?.stock ?? product.stock
}
