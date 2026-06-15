'use client'

import { formatCurrency } from '@/utils/formatters'
import WishlistButton from '@/components/WishlistButton'

interface Product {
  id:           string
  name:         string
  price:        number
  stock:        number
  category:     string
  description?: string
}

interface Props {
  product:       Product
  onAddToCart?:  (id: string) => void
  wishlisted?:   boolean
  onWishlist?:   (product: Product) => void
}

export default function ProductCard({ product, onAddToCart, wishlisted = false, onWishlist }: Props) {
  const outOfStock = product.stock === 0

  return (
    <div data-testid="product-card" className="rounded-xl border p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <p data-testid="product-name" className="font-semibold text-foreground">{product.name}</p>
          <p data-testid="product-category" className="text-xs text-muted-foreground capitalize">{product.category}</p>
        </div>
        <div className="flex items-center gap-1">
          {onWishlist && (
            <WishlistButton
              wishlisted={wishlisted}
              onClick={() => onWishlist(product)}
              label={product.name}
            />
          )}
          <p data-testid="product-price" className="font-bold text-indigo-600">
            {formatCurrency(product.price)}
          </p>
        </div>
      </div>

      {product.description && (
        <p data-testid="product-description" className="text-sm text-muted-foreground">
          {product.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-1">
        <span
          data-testid="product-stock"
          className={`text-xs font-medium ${outOfStock ? 'text-red-500' : 'text-emerald-600'}`}
        >
          {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
        </span>

        <button
          data-testid="add-to-cart-button"
          aria-label={`Add ${product.name} to cart`}
          disabled={outOfStock}
          onClick={() => onAddToCart?.(product.id)}
          className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          Add to cart
        </button>
      </div>
    </div>
  )
}
