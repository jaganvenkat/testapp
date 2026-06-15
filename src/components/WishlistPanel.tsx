'use client'

import { Wishlist } from '@/hooks/useWishlist'
import { formatCurrency } from '@/utils/formatters'

interface Props {
  wishlist: Wishlist
  isOpen:   boolean
  onClose:  () => void
  onMoveToCart?: (id: string) => void
}

export default function WishlistPanel({ wishlist, isOpen, onClose, onMoveToCart }: Props) {
  if (!isOpen) return null

  return (
    <div data-testid="wishlist-overlay" className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <aside data-testid="wishlist-panel" className="relative z-10 flex w-full max-w-sm flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">
            Saved items
            {wishlist.items.length > 0 && (
              <span data-testid="wishlist-count" className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">
                {wishlist.items.length}
              </span>
            )}
          </h2>
          <button
            data-testid="wishlist-close"
            aria-label="Close wishlist"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <ul data-testid="wishlist-items" className="flex-1 overflow-y-auto divide-y px-4">
          {wishlist.items.length === 0 ? (
            <li data-testid="wishlist-empty" className="py-12 text-center text-sm text-gray-400">
              No saved items yet
            </li>
          ) : (
            wishlist.items.map(item => (
              <li key={item.id} data-testid="wishlist-item" className="flex items-center gap-3 py-4">
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{item.category}</p>
                  <p className="text-sm font-semibold text-indigo-600">{formatCurrency(item.price)}</p>
                </div>

                <div className="flex flex-col gap-1">
                  {onMoveToCart && (
                    <button
                      data-testid="move-to-cart-button"
                      onClick={() => { onMoveToCart(item.id); wishlist.remove(item.id) }}
                      className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Add to cart
                    </button>
                  )}
                  <button
                    aria-label={`Remove ${item.name} from wishlist`}
                    onClick={() => wishlist.remove(item.id)}
                    className="text-red-400 hover:text-red-600 text-xs text-right"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        {wishlist.items.length > 0 && (
          <div className="border-t px-4 py-4">
            <button
              data-testid="clear-wishlist-button"
              onClick={wishlist.clear}
              className="w-full rounded border py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear all saved items
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
