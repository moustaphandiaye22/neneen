import { useEffect, useRef, useState } from 'react'
import type { CartLine, Product } from '../../types'
import { mergeCart, saveCart } from '../../services/cartService'
import { stockForSize } from './stock'

export function useCart(
  token: string | null,
  products: Product[] | undefined,
  onError: (message: string) => void,
) {
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('neneen_cart') || '[]') as CartLine[]
    } catch {
      return []
    }
  })
  const [synced, setSynced] = useState(false)
  const hydrationStarted = useRef(false)

  useEffect(() => {
    localStorage.setItem('neneen_cart', JSON.stringify(cart))
    if (!token || !synced) return
    const timer = setTimeout(() => {
      void saveCart(token, cart).catch(() => undefined)
    }, 500)
    return () => clearTimeout(timer)
  }, [cart, token, synced])

  useEffect(() => {
    if (!token || !products || synced || hydrationStarted.current) return
    hydrationStarted.current = true
    void mergeCart(token, cart)
      .then(({ cart: stored }) => {
        setCart(
          stored.items.flatMap((line) => {
            const product = products.find((item) => item.id === line.productId)
            return product
              ? [
                  {
                    productId: line.productId,
                    size: line.size,
                    quantity: line.quantity,
                    name: product.name,
                    color: product.color,
                    price: product.price,
                  },
                ]
              : []
          }),
        )
        setSynced(true)
      })
      .catch(() => {
        setSynced(true)
      })
  }, [token, products, synced, cart, onError])

  function changeCart(product: Product, size: string, delta: number) {
    setCart((current) => {
      const line = current.find((item) => item.productId === product.id && item.size === size)
      if (line)
        return current
          .map((item) =>
            item === line
              ? {
                  ...item,
                  quantity: Math.min(
                    stockForSize(product, size),
                    Math.max(0, item.quantity + delta),
                  ),
                }
              : item,
          )
          .filter((item) => item.quantity > 0)
      return delta > 0 && stockForSize(product, size) > 0
        ? [
            ...current,
            {
              productId: product.id,
              name: product.name,
              color: product.color,
              price: product.price,
              size,
              quantity: 1,
            },
          ]
        : current
    })
  }

  function resetSync() {
    hydrationStarted.current = false
    setSynced(false)
  }

  function clearCart() {
    resetSync()
    setCart([])
  }

  return {
    cart,
    setCart,
    changeCart,
    resetSync,
    clearCart,
    total: cart.reduce((total, item) => total + item.price * item.quantity, 0),
    count: cart.reduce((total, item) => total + item.quantity, 0),
  }
}
