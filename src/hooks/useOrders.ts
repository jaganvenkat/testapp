'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Order } from '@/lib/db'

export interface OrdersState {
  orders:  Order[]
  loading: boolean
  error:   string | null
  refresh: () => void
}

export function useOrders(userId: string | null): OrdersState {
  const [orders,  setOrders]  = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const fetch_ = useCallback(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    fetch(`/api/orders?userId=${encodeURIComponent(userId)}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to load orders')
        return r.json()
      })
      .then(data => setOrders(data.orders))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => { fetch_() }, [fetch_])

  return { orders, loading, error, refresh: fetch_ }
}
