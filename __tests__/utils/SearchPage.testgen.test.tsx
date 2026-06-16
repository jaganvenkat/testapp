import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'
import SearchPage from '@/components/SearchPage'

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

jest.mock('@/utils/formatters', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}))

jest.mock('@/components/WishlistButton', () => {
  return function WishlistButton({ wishlisted, onClick, label }: { wishlisted: boolean; onClick: () => void; label: string }) {
    return (
      <button
        aria-label={wishlisted ? `Remove ${label} from wishlist` : `Add ${label} to wishlist`}
        onClick={onClick}
      >
        {wishlisted ? '♥' : '♡'}
      </button>
    )
  }
})

jest.mock('@/components/SearchBar', () => {
  return function SearchBar({
    query,
    category,
    categories,
    onQuery,
    onCategory,
    onReset,
  }: {
    query: string
    category: string
    categories: string[]
    onQuery: (q: string) => void
    onCategory: (c: string) => void
    onReset: () => void
  }) {
    return (
      <div data-testid="search-bar">
        <input
          data-testid="search-input"
          aria-label="Search products"
          value={query}
          onChange={e => onQuery(e.target.value)}
        />
        <select
          data-testid="category-select"
          aria-label="Filter by category"
          value={category}
          onChange={e => onCategory(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button data-testid="search-reset" onClick={onReset}>Clear</button>
      </div>
    )
  }
})

jest.mock('@/components/ProductCard', () => {
  return function ProductCard({
    product,
    onAddToCart,
    wishlisted,
    onWishlist,
  }: {
    product: { id: string; name: string; price: number; stock: number; category: string; description?: string }
    onAddToCart?: (id: string) => void
    wishlisted?: boolean
    onWishlist?: (product: { id: string; name: string; price: number; stock: number; category: string; description?: string }) => void
  }) {
    return (
      <div data-testid="product-card">
        <p data-testid="product-name">{product.name}</p>
        <p data-testid="product-category">{product.category}</p>
        <p data-testid="product-price">${product.price.toFixed(2)}</p>
        <button
          data-testid="add-to-cart-button"
          aria-label={`Add ${product.name} to cart`}
          onClick={() => onAddToCart?.(product.id)}
          disabled={product.stock === 0}
        >
          Add to cart
        </button>
        {onWishlist && (
          <button
            data-testid="wishlist-button"
            aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            onClick={() => onWishlist(product)}
          >
            {wishlisted ? '♥' : '♡'}
          </button>
        )}
      </div>
    )
  }
})

// ---------------------------------------------------------------------------
// Mock hooks
// ---------------------------------------------------------------------------

const mockAddItem = jest.fn()
const mockToggleWishlist = jest.fn()

// We need a mutable reference for wishlist items across tests
let mockWishlistItems: { id: string; name: string; price: number; category: string }[] = []

jest.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    items: [],
    totalItems: 0,
    totalPrice: 0,
    addItem: mockAddItem,
    removeItem: jest.fn(),
    updateQty: jest.fn(),
    clearCart: jest.fn(),
  }),
}))

jest.mock('@/hooks/useWishlist', () => ({
  useWishlist: () => ({
    items: mockWishlistItems,
    has: (id: string) => mockWishlistItems.some((i: { id: string }) => i.id === id),
    toggle: mockToggleWishlist,
    remove: jest.fn(),
    clear: jest.fn(),
  }),
}))

jest.mock('@/hooks/useProductSearch', () => ({
  useProductSearch: (allProducts: any[]) => ({
    query: '',
    category: '',
    results: allProducts,
    setQuery: jest.fn(),
    setCategory: jest.fn(),
    reset: jest.fn(),
  }),
}))

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleProducts = [
  { id: '1', name: 'Widget A', price: 10.0, stock: 5, category: 'widgets', description: 'A widget' },
  { id: '2', name: 'Gadget B', price: 20.0, stock: 0, category: 'gadgets', description: 'A gadget' },
  { id: '3', name: 'Widget C', price: 15.0, stock: 3, category: 'widgets' },
]

// ---------------------------------------------------------------------------
// Helper to mock fetch
// ---------------------------------------------------------------------------

function mockFetchSuccess(products = sampleProducts) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    json: async () => ({ products }),
  } as Response)
}

function mockFetchFailure() {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: false,
    json: async () => ({}),
  } as Response)
}

function mockFetchNetworkError() {
  global.fetch = jest.fn().mockRejectedValueOnce(new Error('Failed to load products'))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SearchPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWishlistItems = []
  })

  it('TC-001: fetches products from /api/products on mount', async () => {
    mockFetchSuccess()

    render(<SearchPage />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/products')
    })
  })

  it('TC-002: displays loading state while fetching products', async () => {
    // Use a never-resolving promise to keep loading state
    global.fetch = jest.fn().mockReturnValueOnce(new Promise(() => {}))

    render(<SearchPage />)

    expect(screen.getByTestId('search-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('search-page')).not.toBeInTheDocument()
  })

  it('TC-003: displays error message when API fetch fails', async () => {
    mockFetchFailure()

    render(<SearchPage />)

    await waitFor(() => {
      expect(screen.getByTestId('search-error')).toBeInTheDocument()
    })

    expect(screen.getByTestId('search-error')).toHaveTextContent('Failed to load products')
    expect(screen.queryByTestId('search-page')).not.toBeInTheDocument()
  })

  it('TC-003 (network error): displays error message when fetch network error occurs', async () => {
    mockFetchNetworkError()

    render(<SearchPage />)

    await waitFor(() => {
      expect(screen.getByTestId('search-error')).toBeInTheDocument()
    })

    expect(screen.getByTestId('search-error')).toHaveTextContent('Failed to load products')
  })

  it('TC-004: renders search results grid with ProductCard components', async () => {
    mockFetchSuccess()

    render(<SearchPage />)

    await waitFor(() => {
      expect(screen.getByTestId('search-page')).toBeInTheDocument()
    })

    expect(screen.getByTestId('search-results')).toBeInTheDocument()
    const cards = screen.getAllByTestId('product-card')
    expect(cards).toHaveLength(sampleProducts.length)
  })

  it('TC-005: displays empty state when results array is empty', async () => {
    mockFetchSuccess([])

    render(<SearchPage />)

    await waitFor(() => {
      expect(screen.getByTestId('search-page')).toBeInTheDocument()
    })

    expect(screen.getByTestId('search-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('search-results')).not.toBeInTheDocument()
  })

  it('TC-006: extracts and sorts unique categories from allProducts', async () => {
    mockFetchSuccess(sampleProducts)

    render(<SearchPage />)

    await waitFor(() => {
      expect(screen.getByTestId('search-page')).toBeInTheDocument()
    })

    // Categories should be unique and sorted: ['gadgets', 'widgets']
    const select = screen.getByTestId('category-select')
    const options = Array.from(select.querySelectorAll('option')).map(o => o.value).filter(v => v !== '')
    expect(options).toEqual(['gadgets', 'widgets'])
    expect(options).toEqual([...options].sort())
  })

  it('TC-007: onAddToCart handler finds product and calls addItem with correct payload', async () => {
    mockFetchSuccess(sampleProducts)

    render(<SearchPage />)

    await waitFor(() => {
      expect(screen.getByTestId('search-page')).toBeInTheDocument()
    })

    const addToCartButtons = screen.getAllByTestId('add-to-cart-button')
    // Click the first product's add-to-cart button (Widget A, stock > 0)
    fireEvent.click(addToCartButtons[0])

    expect(mockAddItem).toHaveBeenCalledTimes(1)
    expect(mockAddItem).toHaveBeenCalledWith({
      id: sampleProducts[0].id,
      name: sampleProducts[0].name,
      price: sampleProducts[0].price,
    })
  })

  it('TC-008: passes wishlisted status and toggleWishlist callback to ProductCard', async () => {
    // Mark product '1' as wishlisted
    mockWishlistItems = [{ id: '1', name: 'Widget A', price: 10.0, category: 'widgets' }]

    mockFetchSuccess(sampleProducts)

    render(<SearchPage />)

    await waitFor(() => {
      expect(screen.getByTestId('search-page')).toBeInTheDocument()
    })

    // The first product (Widget A, id='1') should be wishlisted
    const wishlistButtons = screen.getAllByTestId('wishlist-button')

    // First button should show as wishlisted (♥)
    expect(wishlistButtons[0]).toHaveTextContent('♥')
    // Second button should not be wishlisted (♡)
    expect(wishlistButtons[1]).toHaveTextContent('♡')

    // Click wishlist button on the first product
    fireEvent.click(wishlistButtons[0])

    expect(mockToggleWishlist).toHaveBeenCalledTimes(1)
    expect(mockToggleWishlist).toHaveBeenCalledWith(
      expect.objectContaining({ id: sampleProducts[0].id })
    )
  })
})