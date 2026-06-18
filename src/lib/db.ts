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

export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface Notification {
  id:        string
  userId:    string
  title:     string
  body:      string
  type:      NotificationType
  read:      boolean
  createdAt: Date
}

// In-memory store for demo — replace with real DB in production
const users         = new Map<string, User>()
const products      = new Map<string, Product>()
const notifications = new Map<string, Notification>()

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
  notifications: {
    findByUserId: (userId: string) =>
      [...notifications.values()]
        .filter(n => n.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    create: (n: Notification) => { notifications.set(n.id, n); return n },
    markRead: (id: string) => {
      const n = notifications.get(id)
      if (!n) return null
      const updated = { ...n, read: true }
      notifications.set(id, updated)
      return updated
    },
    markAllRead: (userId: string) => {
      for (const [id, n] of notifications) {
        if (n.userId === userId) notifications.set(id, { ...n, read: true })
      }
    },
    delete: (id: string) => notifications.delete(id),
  },
}
