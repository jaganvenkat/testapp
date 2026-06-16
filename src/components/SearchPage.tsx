'use client'

import { useState, useEffect } from 'react'
import SearchBar from '@/components/SearchBar'
import ProductCard from '@/components/ProductCard'
import { useProductSearch, type SearchableProduct } from '@/hooks/useProductSearch'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'

export default function SearchPage() {
  const [allProducts, setAllProducts] = useState<SearchableProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { query, category, results, setQuery, setCategory, reset } = useProductSearch(allProducts)
  const { addItem } = useCart()
  const { items: wishlistItems, toggle: toggleWishlist } = useWishlist()

  const categories = [...new Set(allProducts.map(p => p.category))].sort()

  useEffect(() => {
    fetch('/api/products')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load products')
        return r.json()
      })
      .then(data => setAllProducts(data.products))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="search-loading">
        <span className="text-muted-foreground text-sm">Loading products…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="search-error">
        <span className="text-red-500 text-sm">{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid="search-page">
      <SearchBar
        query={query}
        category={category}
        categories={categories}
        onQuery={setQuery}
        onCategory={setCategory}
        onReset={reset}
      />

      <p className="text-xs text-muted-foreground" data-testid="search-count">
        {results.length} {results.length === 1 ? 'result' : 'results'}
      </p>

      {results.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm" data-testid="search-empty">
          No products match your search.
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="search-results"
        >
          {results.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={id => {
                const p = results.find(r => r.id === id)
                if (p) addItem({ id: p.id, name: p.name, price: p.price })
              }}
              wishlisted={wishlistItems.some(w => w.id === product.id)}
              onWishlist={toggleWishlist}
            />
          ))}
        </div>
      )}
    </div>
  )
}
