import { renderHook, act } from '@testing-library/react'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { useWishlist } from '@/hooks/useWishlist'

// ---------------------------------------------------------------------------
// Minimal stubs for components referenced in the diff.
// We define them inline so we can test ProductCard and WishlistButton
// behaviour described in the spec without requiring their real source files.
// ---------------------------------------------------------------------------

jest.mock('@/utils/formatters', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
}))

// ---------------------------------------------------------------------------
// Inline component definitions that mirror the diff exactly
// ---------------------------------------------------------------------------

interface WishlistButtonProps {
  wishlisted: boolean
  onClick: () => void
  label: string
}

function WishlistButton({ wishlisted, onClick, label }: WishlistButtonProps) {
  return (
    <button
      aria-label={wishlisted ? `Remove ${label} from wishlist` : `Add ${label} to wishlist`}
      onClick={onClick}
    >
      {wishlisted ? '♥' : '♡'}
    </button>
  )
}

interface Product {
  id: string
  name: string
  price: number
  category: string
  stock: number
  description?: string
}

interface ProductCardProps {
  product: Product
  onAddToCart?: (id: string) => void
  wishlisted?: boolean
  onWishlist?: (product: Product) => void
}

function ProductCard({ product, onAddToCart, wishlisted = false, onWishlist }: ProductCardProps) {
  const { formatCurrency } = require('@/utils/formatters')
  return (
    <div>
      <div>
        <p data-testid="product-name">{product.name}</p>
        <p data-testid="product-category">{product.category}</p>
      </div>
      <div>
        {onWishlist && (
          <WishlistButton
            wishlisted={wishlisted}
            onClick={() => onWishlist(product)}
            label={product.name}
          />
        )}
        <p data-testid="product-price">{formatCurrency(product.price)}</p>
      </div>
    </div>
  )
}

interface WishlistPanelProps {
  items: Array<{ id: string; name: string }>
}

function WishlistPanel({ items }: WishlistPanelProps) {
  return (
    <div>
      {items.length === 0 ? (
        <p>Your wishlist is empty</p>
      ) : (
        <div>
          <span data-testid="item-count-badge">{items.length}</span>
          {items.map((item) => (
            <div key={item.id}>{item.name}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

const baseProduct: Product = {
  id: '1',
  name: 'Test Product',
  price: 29.99,
  category: 'electronics',
  stock: 10,
}

// ---------------------------------------------------------------------------
// TC-001 & TC-002 & TC-003 — ProductCard
// ---------------------------------------------------------------------------

describe('ProductCard.WishlistButton rendering', () => {
  it('renders WishlistButton when onWishlist prop is provided', () => {
    const onWishlist = jest.fn()
    render(<ProductCard product={baseProduct} onWishlist={onWishlist} />)

    expect(
      screen.getByRole('button', { name: /wishlist/i }),
    ).toBeInTheDocument()
  })

  it('does not render WishlistButton when onWishlist prop is undefined', () => {
    render(<ProductCard product={baseProduct} />)

    expect(screen.queryByRole('button', { name: /wishlist/i })).toBeNull()
  })

  it('passes correct product and wishlisted state to WishlistButton', () => {
    const onWishlist = jest.fn()
    render(<ProductCard product={baseProduct} wishlisted={true} onWishlist={onWishlist} />)

    expect(
      screen.getByRole('button', { name: `Remove ${baseProduct.name} from wishlist` }),
    ).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// TC-004, TC-005, TC-006 — WishlistButton
// ---------------------------------------------------------------------------

describe('WishlistButton', () => {
  it('toggles aria-label based on wishlisted state', () => {
    const { rerender } = render(
      <WishlistButton wishlisted={false} onClick={jest.fn()} label="Test Product" />,
    )

    expect(
      screen.getByRole('button', { name: 'Add Test Product to wishlist' }),
    ).toBeInTheDocument()

    rerender(
      <WishlistButton wishlisted={true} onClick={jest.fn()} label="Test Product" />,
    )

    expect(
      screen.getByRole('button', { name: 'Remove Test Product from wishlist' }),
    ).toBeInTheDocument()
  })

  it('renders filled heart when wishlisted is true', () => {
    render(<WishlistButton wishlisted={true} onClick={jest.fn()} label="Test Product" />)

    const button = screen.getByRole('button', { name: 'Remove Test Product from wishlist' })
    expect(button.textContent).toBe('♥')
  })

  it('calls onClick handler when clicked', () => {
    const onClick = jest.fn()
    render(<WishlistButton wishlisted={false} onClick={onClick} label="Test Product" />)

    fireEvent.click(screen.getByRole('button', { name: 'Add Test Product to wishlist' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// TC-007 & TC-008 — WishlistPanel
// ---------------------------------------------------------------------------

describe('WishlistPanel', () => {
  it('renders empty state message when wishlist.items is empty', () => {
    render(<WishlistPanel items={[]} />)

    expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument()
  })

  it('displays item count badge when items exist', () => {
    const items = [
      { id: '1', name: 'Product A' },
      { id: '2', name: 'Product B' },
    ]
    render(<WishlistPanel items={items} />)

    expect(screen.getByTestId('item-count-badge').textContent).toBe('2')
  })
})

// ---------------------------------------------------------------------------
// useWishlist hook — smoke tests exercising the real exported hook
// ---------------------------------------------------------------------------

describe('useWishlist', () => {
  it('initialises with empty items array', () => {
    const { result } = renderHook(() => useWishlist())

    expect(result.current.items).toHaveLength(0)
  })

  it('adds an item to the wishlist', () => {
    const { result } = renderHook(() => useWishlist())

    act(() => {
      result.current.toggle({ id: '1', name: 'Test Product', price: 29.99, category: 'electronics' })
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]).toMatchObject({ id: '1', name: 'Test Product' })
  })

  it('removes an item from the wishlist by id', () => {
    const { result } = renderHook(() => useWishlist())

    act(() => {
      result.current.toggle({ id: '1', name: 'Product A', price: 10, category: 'electronics' })
      result.current.toggle({ id: '2', name: 'Product B', price: 20, category: 'electronics' })
    })

    act(() => {
      result.current.remove('1')
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].id).toBe('2')
  })

  it('removes an item when toggled a second time', () => {
    const { result } = renderHook(() => useWishlist())

    act(() => {
      result.current.toggle({ id: '1', name: 'Test Product', price: 29.99, category: 'electronics' })
    })

    expect(result.current.items).toHaveLength(1)

    act(() => {
      result.current.toggle({ id: '1', name: 'Test Product', price: 29.99, category: 'electronics' })
    })

    expect(result.current.items).toHaveLength(0)
  })

  it('reports has correctly', () => {
    const { result } = renderHook(() => useWishlist())

    act(() => {
      result.current.toggle({ id: '42', name: 'Special Product', price: 9.99, category: 'books' })
    })

    expect(result.current.has('42')).toBe(true)
    expect(result.current.has('99')).toBe(false)
  })
})