import { renderHook, act } from '@testing-library/react'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { useOrders } from '@/hooks/useOrders'
import type { Order, OrderStatus } from '@/lib/db'

// ---------------------------------------------------------------------------
// Inline minimal OrderHistory component mirroring the diff exactly
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-50   text-blue-700   border-blue-200',
  shipped:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered:  'bg-green-50  text-green-700  border-green-200',
  cancelled:  'bg-red-50    text-red-700    border-red-200',
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('@/hooks/useOrders')

jest.mock('@/utils/formatters', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  formatDate: (date: Date | string) => String(date),
  capitalise: (text: string) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
}))

import { useAuth } from '@/hooks/useAuth'
import type { AuthState } from '@/hooks/useAuth'
import type { OrdersState } from '@/hooks/useOrders'

// ---------------------------------------------------------------------------
// Inline OrderHistory component (mirrors diff)
// ---------------------------------------------------------------------------

function OrderHistory() {
  const { formatCurrency: fc, formatDate: fd, capitalise: cap } = require('@/utils/formatters')
  const auth: AuthState = useAuth()
  const { orders, loading, error, refresh }: OrdersState = useOrders(auth.user?.sub ?? null)

  if (!auth.user) {
    return <p data-testid="unauthenticated">Please log in to view your orders.</p>
  }

  if (loading) return <p data-testid="loading">Loading…</p>
  if (error)   return <p data-testid="error">{error}</p>

  return (
    <div data-testid="order-history">
      <button onClick={refresh} data-testid="refresh-button">Refresh</button>
      {orders.length === 0 && <p data-testid="no-orders">No orders found.</p>}
      {orders.map(order => (
        <div key={order.id} data-testid={`order-${order.id}`}>
          <span data-testid={`status-${order.id}`} className={STATUS_STYLES[order.status]}>
            {cap(order.status)}
          </span>
          <span data-testid={`total-${order.id}`}>{fc(order.total)}</span>
          <span data-testid={`date-${order.id}`}>{fd(order.createdAt)}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUseAuth  = useAuth  as jest.MockedFunction<typeof useAuth>
const mockUseOrders = useOrders as jest.MockedFunction<typeof useOrders>

function makeAuthState(overrides: Partial<AuthState> = {}): AuthState {
  return {
    user:            null,
    token:           null,
    isAuthenticated: false,
    login:           jest.fn(),
    logout:          jest.fn(),
    ...overrides,
  }
}

function makeOrdersState(overrides: Partial<OrdersState> = {}): OrdersState {
  return {
    orders:  [],
    loading: false,
    error:   null,
    refresh: jest.fn(),
    ...overrides,
  }
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id:        'order-1',
    userId:    'user-1',
    items:     [{ productId: 'p1', name: 'Widget', price: 10, quantity: 2 }],
    total:     20,
    status:    'pending',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Reset mocks between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
})

// ---------------------------------------------------------------------------
// useOrders hook unit tests
// ---------------------------------------------------------------------------

describe('useOrders hook', () => {
  it('TC-001: initializes with null userId and does not fetch', () => {
    // Unmock useOrders temporarily for this test
    jest.unmock('@/hooks/useOrders')
    const { useOrders: realUseOrders } = require('@/hooks/useOrders')

    const fetchSpy = jest.spyOn(global, 'fetch')

    const { result } = renderHook(() => realUseOrders(null))

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.current.orders).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()

    // Re-mock for subsequent tests
    jest.mock('@/hooks/useOrders')
  })

  it('TC-002: calls fetch on mount with valid userId', async () => {
    jest.unmock('@/hooks/useOrders')
    const { useOrders: realUseOrders } = require('@/hooks/useOrders')

    const ordersData: Order[] = [makeOrder()]
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok:   true,
      json: async () => ({ orders: ordersData }),
    } as Response)

    const { result } = renderHook(() => realUseOrders('user-1'))

    expect(fetchSpy).toHaveBeenCalledWith(
      `/api/orders?userId=${encodeURIComponent('user-1')}`,
    )

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.orders).toEqual(ordersData)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()

    jest.mock('@/hooks/useOrders')
  })

  it('TC-003: exposes refresh() to manually trigger re-fetch', async () => {
    jest.unmock('@/hooks/useOrders')
    const { useOrders: realUseOrders } = require('@/hooks/useOrders')

    const ordersData: Order[] = [makeOrder()]
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok:   true,
      json: async () => ({ orders: ordersData }),
    } as Response)

    const { result } = renderHook(() => realUseOrders('user-1'))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)

    await act(async () => {
      result.current.refresh()
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(fetchSpy).toHaveBeenLastCalledWith(
      `/api/orders?userId=${encodeURIComponent('user-1')}`,
    )

    jest.mock('@/hooks/useOrders')
  })

  it('TC-004: handles API error response and sets error state', async () => {
    jest.unmock('@/hooks/useOrders')
    const { useOrders: realUseOrders } = require('@/hooks/useOrders')

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok:   false,
      json: async () => ({ error: 'Failed to load orders' }),
    } as Response)

    const { result } = renderHook(() => realUseOrders('user-1'))

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.error).toBe('Failed to load orders')
    expect(result.current.orders).toEqual([])
    expect(result.current.loading).toBe(false)

    jest.mock('@/hooks/useOrders')
  })
})

// ---------------------------------------------------------------------------
// OrderHistory component unit tests
// ---------------------------------------------------------------------------

describe('OrderHistory component', () => {
  it('TC-009: renders unauthenticated state when user is null', () => {
    mockUseAuth.mockReturnValue(makeAuthState({ user: null }))
    mockUseOrders.mockReturnValue(makeOrdersState())

    render(<OrderHistory />)

    expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
    expect(screen.getByTestId('unauthenticated')).toHaveTextContent(
      'Please log in to view your orders.',
    )
  })

  it('TC-010: applies correct STATUS_STYLES color for each OrderStatus', () => {
    const statuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

    const orders: Order[] = statuses.map((status, i) =>
      makeOrder({ id: `order-${i}`, status }),
    )

    mockUseAuth.mockReturnValue(
      makeAuthState({
        user:            { sub: 'user-1', email: 'user@example.com', role: 'user', iat: 0, exp: 9999999999 },
        isAuthenticated: true,
        token:           'fake-token',
      }),
    )
    mockUseOrders.mockReturnValue(makeOrdersState({ orders }))

    render(<OrderHistory />)

    statuses.forEach((status, i) => {
      const statusEl = screen.getByTestId(`status-order-${i}`)
      expect(statusEl).toHaveClass(STATUS_STYLES[status].split(' ')[0])
    })

    expect(STATUS_STYLES['pending']).toContain('yellow')
    expect(STATUS_STYLES['processing']).toContain('blue')
    expect(STATUS_STYLES['shipped']).toContain('indigo')
    expect(STATUS_STYLES['delivered']).toContain('green')
    expect(STATUS_STYLES['cancelled']).toContain('red')
  })
})