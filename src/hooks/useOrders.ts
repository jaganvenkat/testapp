'use client'

import { useState, useCallback } from 'react'
import { CartItem } from '@/hooks/useCart'
import { Order } from '@/lib/db'

interface UseOrdersOptions {
  token: string | null
}

export function useOrders({ token }: UseOrdersOptions) {
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch orders')
      setOrders(data.orders)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [token])

  const placeOrder = useCallback(async (items: CartItem[]): Promise<Order | null> => {
    if (!token) { setError('Not authenticated'); return null }
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/orders', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          items: items.map(i => ({
            productId: i.id,
            name:      i.name,
            price:     i.price,
            quantity:  i.quantity,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to place order')
      setOrders(prev => [data.order, ...prev])
      return data.order as Order
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }, [token])

  return { orders, loading, error, fetchOrders, placeOrder }
}
