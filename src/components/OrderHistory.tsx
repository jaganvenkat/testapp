'use client'

import { useEffect } from 'react'
import { useOrders } from '@/hooks/useOrders'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface Props {
  token:   string | null
  isOpen:  boolean
  onClose: () => void
}

export default function OrderHistory({ token, isOpen, onClose }: Props) {
  const { orders, loading, error, fetchOrders } = useOrders({ token })

  useEffect(() => {
    if (isOpen) fetchOrders()
  }, [isOpen, fetchOrders])

  if (!isOpen) return null

  return (
    <div data-testid="orders-overlay" className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <aside data-testid="orders-panel" className="relative z-10 flex w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Order History</h2>
          <button
            aria-label="Close order history"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {loading && (
            <p className="py-12 text-center text-sm text-gray-400">Loading orders…</p>
          )}

          {error && (
            <p className="py-6 text-center text-sm text-red-500">{error}</p>
          )}

          {!loading && !error && orders.length === 0 && (
            <p data-testid="orders-empty" className="py-12 text-center text-sm text-gray-400">
              No orders yet
            </p>
          )}

          {!loading && orders.map(order => (
            <div key={order.id} data-testid="order-item" className="border-b py-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{formatDate(order.createdAt, 'long')}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <ul className="space-y-1">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.name}
                      <span className="ml-1 text-gray-400">×{item.quantity}</span>
                    </span>
                    <span className="text-gray-600">{formatCurrency(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex justify-between font-semibold text-sm pt-1">
                <span>Order total</span>
                <span data-testid="order-total">{formatCurrency(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}

function statusClass(status: string) {
  switch (status) {
    case 'confirmed':  return 'bg-blue-100 text-blue-700'
    case 'shipped':    return 'bg-yellow-100 text-yellow-700'
    case 'delivered':  return 'bg-green-100 text-green-700'
    case 'cancelled':  return 'bg-red-100 text-red-700'
    default:           return 'bg-gray-100 text-gray-600'
  }
}
