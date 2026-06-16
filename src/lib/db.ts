export interface User {
  id:        string
  name:      string
  email:     string
  password:  string
  role:      'admin' | 'user'
  createdAt: Date
}

export interface Product {
  id:          string
  name:        string
  price:       number
  stock:       number
  category:    string
  description?: string
  createdAt:   Date
}

export interface OrderItem {
  productId: string
  name:      string
  price:     number
  quantity:  number
}

export interface Order {
  id:        string
  userId:    string
  items:     OrderItem[]
  total:     number
  status:    'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: Date
}

// In-memory store for demo — replace with real DB in production
const users    = new Map<string, User>()
const products = new Map<string, Product>()
const orders   = new Map<string, Order>()

export const db = {
  users: {
    findByEmail: (email: string) =>
      [...users.values()].find((u) => u.email === email) ?? null,
    findById: (id: string) => users.get(id) ?? null,
    create: (user: User) => { users.set(user.id, user); return user },
    update: (id: string, data: Partial<User>) => {
      const existing = users.get(id)
      if (!existing) return null
      const updated = { ...existing, ...data }
      users.set(id, updated)
      return updated
    },
    delete: (id: string) => users.delete(id),
    list: () => [...users.values()],
  },
  products: {
    findById:  (id: string) => products.get(id) ?? null,
    findByCategory: (category: string) =>
      [...products.values()].filter((p) => p.category === category),
    create: (product: Product) => { products.set(product.id, product); return product },
    update: (id: string, data: Partial<Product>) => {
      const existing = products.get(id)
      if (!existing) return null
      const updated = { ...existing, ...data }
      products.set(id, updated)
      return updated
    },
    delete: (id: string) => products.delete(id),
    list: () => [...products.values()],
  },
  orders: {
    findById:     (id: string) => orders.get(id) ?? null,
    findByUserId: (userId: string) =>
      [...orders.values()]
        .filter(o => o.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    create: (order: Order) => { orders.set(order.id, order); return order },
    update: (id: string, data: Partial<Order>) => {
      const existing = orders.get(id)
      if (!existing) return null
      const updated = { ...existing, ...data }
      orders.set(id, updated)
      return updated
    },
    list: () => [...orders.values()],
  },
}
