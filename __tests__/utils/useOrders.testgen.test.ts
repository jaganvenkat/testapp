import { renderHook, act, waitFor } from '@testing-library/react'
import { useOrders } from '@/hooks/useOrders'
import { db } from '@/lib/db'
import type { Order, OrderStatus } from '@/lib/db'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id:        'order-1',
    userId:    'user-1',
    items:     [],
    total:     100,
    status:    'pending' as OrderStatus,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Mock fetch globally
// ---------------------------------------------------------------------------

const mockFetch = jest.fn()

beforeAll(() => {
  global.fetch = mockFetch as jest.Mock
})

beforeEach(() => {
  mockFetch.mockReset()
})

// ---------------------------------------------------------------------------
// Tests — useOrders hook
// ---------------------------------------------------------------------------

describe('useOrders hook', () => {
  it('TC-001: initializes with empty orders and false loading when userId is null', () => {
    const { result } = renderHook(() => useOrders(null))

    expect(result.current.orders).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('TC-002: calls fetch with correct encoded userId query parameter on mount', async () => {
    const userId = 'user abc'
    const orders = [buildOrder({ userId })]

    mockFetch.mockResolvedValueOnce({
      ok:   true,
      json: () => Promise.resolve({ orders }),
    } as Response)

    const { result } = renderHook(() => useOrders(userId))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/orders?userId=${encodeURIComponent(userId)}`
    )
  })

  it('TC-003: handles fetch failure and sets error message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok:   false,
      json: () => Promise.resolve({}),
    } as Response)

    const { result } = renderHook(() => useOrders('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Failed to load orders')
    expect(result.current.orders).toEqual([])
  })

  it('TC-004: refresh function triggers new fetch and resets loading/error state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok:   false,
      json: () => Promise.resolve({}),
    } as Response)

    const { result } = renderHook(() => useOrders('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Failed to load orders')

    const freshOrders = [buildOrder()]
    mockFetch.mockResolvedValueOnce({
      ok:   true,
      json: () => Promise.resolve({ orders: freshOrders }),
    } as Response)

    act(() => {
      result.current.refresh()
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeNull()
    expect(result.current.orders).toEqual(freshOrders)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('TC-005: parses response JSON and extracts orders array', async () => {
    const orders = [
      buildOrder({ id: 'order-1' }),
      buildOrder({ id: 'order-2', status: 'shipped' }),
    ]

    mockFetch.mockResolvedValueOnce({
      ok:   true,
      json: () => Promise.resolve({ orders }),
    } as Response)

    const { result } = renderHook(() => useOrders('user-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.orders).toHaveLength(2)
    expect(result.current.orders[0].id).toBe('order-1')
    expect(result.current.orders[1].id).toBe('order-2')
    expect(result.current.error).toBeNull()
  })

  it('TC-006: refetches when userId dependency changes', async () => {
    const ordersForUser1 = [buildOrder({ id: 'o1', userId: 'user-1' })]
    const ordersForUser2 = [buildOrder({ id: 'o2', userId: 'user-2' })]

    mockFetch.mockResolvedValueOnce({
      ok:   true,
      json: () => Promise.resolve({ orders: ordersForUser1 }),
    } as Response)

    const { result, rerender } = renderHook(({ userId }) => useOrders(userId), {
      initialProps: { userId: 'user-1' as string | null },
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.orders).toEqual(ordersForUser1)

    mockFetch.mockResolvedValueOnce({
      ok:   true,
      json: () => Promise.resolve({ orders: ordersForUser2 }),
    } as Response)

    rerender({ userId: 'user-2' })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch).toHaveBeenLastCalledWith(
      `/api/orders?userId=${encodeURIComponent('user-2')}`
    )
    expect(result.current.orders).toEqual(ordersForUser2)
  })
})

describe('db.orders.findByUserId', () => {
  it('TC-007: returns orders sorted by createdAt descending', () => {
    const older  = buildOrder({ id: 'older',  createdAt: new Date('2024-01-01T00:00:00.000Z') })
    const newer  = buildOrder({ id: 'newer',  createdAt: new Date('2024-06-01T00:00:00.000Z') })
    const middle = buildOrder({ id: 'middle', createdAt: new Date('2024-03-01T00:00:00.000Z') })

    db.orders.create(older)
    db.orders.create(newer)
    db.orders.create(middle)

    const found = db.orders.findByUserId('user-1')

    const ids = found.map(o => o.id)
    expect(ids.indexOf('newer')).toBeLessThan(ids.indexOf('middle'))
    expect(ids.indexOf('middle')).toBeLessThan(ids.indexOf('older'))
  })
})

describe('db.orders.update', () => {
  it('TC-008: modifies existing order and persists state', () => {
    const order = buildOrder({ id: 'update-test', status: 'pending', total: 50 })
    db.orders.create(order)

    const updated = db.orders.update('update-test', { status: 'shipped', total: 75 })

    expect(updated).not.toBeNull()
    expect(updated!.status).toBe('shipped')
    expect(updated!.total).toBe(75)

    const fetched = db.orders.findById('update-test')
    expect(fetched).not.toBeNull()
    expect(fetched!.status).toBe('shipped')
    expect(fetched!.total).toBe(75)
  })
})