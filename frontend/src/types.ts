export type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF'
  emailVerifiedAt?: string | null
}

export type Activity = {
  id: string
  type: string
  title: string
  description: string
  location: string
  duration?: string | null
  schedule: string[]
  included: string[]
  bringList?: string | null
  startsAt: string
  price: number
  capacity: number
  reserved: number
  status: string
  imageUrl?: string
  featured?: boolean
  variants?: { size: string; stock: number }[]
}

export type Product = {
  id: string
  name: string
  description: string
  color: string
  price: number
  stock: number
  sizes: string[]
  variants?: { size: string; stock: number }[]
  active: boolean
  imageUrl?: string
}

export type CartLine = {
  productId: string
  name: string
  color: string
  price: number
  size: string
  quantity: number
}

export type Row = Record<string, unknown>
export type AuthResult = { user: User; token: string }
export type AdminData = Row
