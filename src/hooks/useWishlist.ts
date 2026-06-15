'use client'

import { useState, useCallback } from 'react'

export interface WishlistItem {
  id:          string
  name:        string
  price:       number
  category:    string
  description?: string
}

export interface Wishlist {
  items:       WishlistItem[]
  has:         (id: string) => boolean
  toggle:      (item: WishlistItem) => void
  remove:      (id: string) => void
  clear:       () => void
}

export function useWishlist(): Wishlist {
  const [items, setItems] = useState<WishlistItem[]>([])

  const has = useCallback((id: string) => items.some(i => i.id === id), [items])

  const toggle = useCallback((item: WishlistItem) => {
    setItems(prev => {
      const exists = prev.some(i => i.id === item.id)
      return exists ? prev.filter(i => i.id !== item.id) : [...prev, item]
    })
  }, [])

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  return { items, has, toggle, remove, clear }
}
