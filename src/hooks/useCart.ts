'use client'

import { useState, useCallback } from 'react'

export interface CartItem {
  id:       string
  name:     string
  price:    number
  quantity: number
}

export interface Cart {
  items:       CartItem[]
  totalItems:  number
  totalPrice:  number
  addItem:     (item: Omit<CartItem, 'quantity'>) => void
  removeItem:  (id: string) => void
  updateQty:   (id: string, quantity: number) => void
  clearCart:   () => void
}

export function useCart(): Cart {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const updateQty = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return { items, totalItems, totalPrice, addItem, removeItem, updateQty, clearCart }
}
