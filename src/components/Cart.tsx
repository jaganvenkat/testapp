'use client'

import { Cart as CartType } from '@/hooks/useCart'
import { formatCurrency } from '@/utils/formatters'

interface Props {
  cart:     CartType
  isOpen:   boolean
  onClose:  () => void
}

export default function Cart({ cart, isOpen, onClose }: Props) {
  if (!isOpen) return null

  return (
    <div data-testid="cart-overlay" className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <aside data-testid="cart-panel" className="relative z-10 flex w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">
            Cart
            {cart.totalItems > 0 && (
              <span data-testid="cart-count" className="ml-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
                {cart.totalItems}
              </span>
            )}
          </h2>
          <button
            data-testid="cart-close"
            aria-label="Close cart"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <ul data-testid="cart-items" className="flex-1 overflow-y-auto divide-y px-4">
          {cart.items.length === 0 ? (
            <li data-testid="cart-empty" className="py-12 text-center text-sm text-gray-400">
              Your cart is empty
            </li>
          ) : (
            cart.items.map(item => (
              <li key={item.id} data-testid="cart-item" className="flex items-center gap-3 py-4">
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.price)} each</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => cart.updateQty(item.id, item.quantity - 1)}
                    className="h-6 w-6 rounded border text-sm hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span data-testid="item-quantity" className="w-6 text-center text-sm">{item.quantity}</span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => cart.updateQty(item.id, item.quantity + 1)}
                    className="h-6 w-6 rounded border text-sm hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                <button
                  aria-label={`Remove ${item.name}`}
                  onClick={() => cart.removeItem(item.id)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  Remove
                </button>
              </li>
            ))
          )}
        </ul>

        {cart.items.length > 0 && (
          <div className="border-t px-4 py-4 space-y-3">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span data-testid="cart-total">{formatCurrency(cart.totalPrice)}</span>
            </div>
            <button
              data-testid="checkout-button"
              className="w-full rounded bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Checkout
            </button>
            <button
              data-testid="clear-cart-button"
              onClick={cart.clearCart}
              className="w-full rounded border py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear cart
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
