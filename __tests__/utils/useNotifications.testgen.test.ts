import { renderHook, act, waitFor } from '@testing-library/react'
import { useNotifications } from '@/hooks/useNotifications'
import type { Notification } from '@/lib/db'

// ---------------------------------------------------------------------------
// Global fetch mock
// ---------------------------------------------------------------------------

const mockFetch = jest.fn()
global.fetch = mockFetch as jest.Mock

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id:        'notif-1',
    userId:    'user-1',
    title:     'Test notification',
    body:      'This is a test',
    type:      'info',
    read:      false,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

function mockFetchSuccess(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok:   true,
    json: () => Promise.resolve(data),
  })
}

function mockFetchError(status = 500) {
  mockFetch.mockResolvedValueOnce({
    ok:     false,
    status,
    json:   () => Promise.resolve({ error: 'Server error' }),
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useNotifications', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  // TC-001
  it('initializes with empty state and null userId', () => {
    const { result } = renderHook(() => useNotifications(null))

    expect(result.current.notifications).toEqual([])
    expect(result.current.unreadCount).toBe(0)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  // TC-002
  describe('refresh', () => {
    it('fetches notifications successfully when userId is provided', async () => {
      const notifications = [
        makeNotification({ id: 'n-1', read: false }),
        makeNotification({ id: 'n-2', read: true }),
      ]
      mockFetchSuccess({ notifications })

      const { result } = renderHook(() => useNotifications('user-1'))

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notifications?userId=user-1',
      )
      expect(result.current.notifications).toEqual(notifications)
      expect(result.current.error).toBeNull()
    })

    it('sets error state when the API call fails', async () => {
      mockFetchError(500)

      const { result } = renderHook(() => useNotifications('user-1'))

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.error).toBe('Failed to load notifications')
      expect(result.current.notifications).toEqual([])
    })

    it('does not fetch when userId is null', () => {
      const { result } = renderHook(() => useNotifications(null))

      expect(result.current.loading).toBe(false)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('re-fetches when refresh is called manually', async () => {
      const notifications = [makeNotification({ id: 'n-1' })]
      mockFetchSuccess({ notifications })

      const { result } = renderHook(() => useNotifications('user-1'))

      await waitFor(() => expect(result.current.loading).toBe(false))

      const moreNotifications = [
        makeNotification({ id: 'n-1' }),
        makeNotification({ id: 'n-2' }),
      ]
      mockFetchSuccess({ notifications: moreNotifications })

      act(() => {
        result.current.refresh()
      })

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.notifications).toEqual(moreNotifications)
    })
  })

  // TC-003
  describe('markRead', () => {
    it('updates local state optimistically after marking a notification as read', async () => {
      const notifications = [
        makeNotification({ id: 'n-1', read: false }),
        makeNotification({ id: 'n-2', read: false }),
      ]
      mockFetchSuccess({ notifications })

      const { result } = renderHook(() => useNotifications('user-1'))

      await waitFor(() => expect(result.current.loading).toBe(false))

      mockFetch.mockResolvedValueOnce({
        ok:   true,
        json: () => Promise.resolve({ notification: { ...notifications[0], read: true } }),
      })

      await act(async () => {
        await result.current.markRead('n-1')
      })

      const updated = result.current.notifications.find(n => n.id === 'n-1')
      expect(updated?.read).toBe(true)

      const untouched = result.current.notifications.find(n => n.id === 'n-2')
      expect(untouched?.read).toBe(false)

      expect(mockFetch).toHaveBeenCalledWith('/api/notifications', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: 'n-1' }),
      })
    })
  })

  // TC-004
  describe('markAllRead', () => {
    it('silently returns without fetching when userId is null', async () => {
      const { result } = renderHook(() => useNotifications(null))

      await act(async () => {
        await result.current.markAllRead()
      })

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('marks all notifications as read when userId is provided', async () => {
      const notifications = [
        makeNotification({ id: 'n-1', read: false }),
        makeNotification({ id: 'n-2', read: false }),
      ]
      mockFetchSuccess({ notifications })

      const { result } = renderHook(() => useNotifications('user-1'))

      await waitFor(() => expect(result.current.loading).toBe(false))

      mockFetch.mockResolvedValueOnce({
        ok:   true,
        json: () => Promise.resolve({ ok: true }),
      })

      await act(async () => {
        await result.current.markAllRead()
      })

      expect(result.current.notifications.every(n => n.read)).toBe(true)

      expect(mockFetch).toHaveBeenLastCalledWith('/api/notifications', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: 'user-1', markAll: true }),
      })
    })
  })

  // TC-005
  describe('unreadCount', () => {
    it('correctly filters unread notifications', async () => {
      const notifications = [
        makeNotification({ id: 'n-1', read: false }),
        makeNotification({ id: 'n-2', read: true }),
        makeNotification({ id: 'n-3', read: false }),
        makeNotification({ id: 'n-4', read: true }),
        makeNotification({ id: 'n-5', read: false }),
      ]
      mockFetchSuccess({ notifications })

      const { result } = renderHook(() => useNotifications('user-1'))

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.unreadCount).toBe(3)
    })

    it('returns 0 unread count when all notifications are read', async () => {
      const notifications = [
        makeNotification({ id: 'n-1', read: true }),
        makeNotification({ id: 'n-2', read: true }),
      ]
      mockFetchSuccess({ notifications })

      const { result } = renderHook(() => useNotifications('user-1'))

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.unreadCount).toBe(0)
    })

    it('returns 0 unread count when there are no notifications', async () => {
      mockFetchSuccess({ notifications: [] })

      const { result } = renderHook(() => useNotifications('user-1'))

      await waitFor(() => expect(result.current.loading).toBe(false))

      expect(result.current.unreadCount).toBe(0)
    })
  })
})