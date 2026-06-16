'use client'

import { useAuth } from '@/hooks/useAuth'
import { useOrders } from '@/hooks/useOrders'
import { formatCurrency, formatDate, capitalise } from '@/utils/formatters'
import type { OrderStatus } from '@/lib/db'

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-50   text-blue-700   border-blue-200',
  shipped:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-50  text-green-700  border-green-200',
  cancelled:  'bg-red-50    text-red-700    border-red-200',
}

export default function OrderHistory() {
  const { user } = useAuth()
  const { orders, loading, error } = useOrders(user?.userId ?? null)

  if (!user) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm" data-testid="orders-unauthenticated">
        Please log in to view your order history.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="orders-loading">
        <span className="text-muted-foreground text-sm">Loading orders…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="orders-error">
        <span className="text-red-500 text-sm">{error}</span>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm" data-testid="orders-empty">
        You haven't placed any orders yet.
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid="order-history">
      {orders.map(order => (
        <div key={order.id} data-testid="order-card" className="rounded-xl border p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground" data-testid="order-id">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="order-date">
                {formatDate(order.createdAt, 'long')}
              </p>
            </div>
            <span
              data-testid="order-status"
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[order.status]}`}
            >
              {capitalise(order.status)}
            </span>
          </div>

          <ul className="divide-y text-sm" data-testid="order-items">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between py-1.5">
                <span>
                  {item.name}
                  <span className="text-muted-foreground ml-1">× {item.quantity}</span>
                </span>
                <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="flex justify-end border-t pt-2">
            <span className="text-sm font-semibold" data-testid="order-total">
              Total: {formatCurrency(order.total)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
