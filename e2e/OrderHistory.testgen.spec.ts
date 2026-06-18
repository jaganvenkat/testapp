import { test, expect } from '@playwright/test'

test.describe('OrderHistory component', () => {
  test('TC-001: displays unauthenticated state when user is null', async ({ page }) => {
    await page.route('/api/auth/login', async route => {
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } })
    })
    await page.route('/api/orders*', async route => {
      await route.fulfill({ status: 200, json: { orders: [] } })
    })

    await page.goto('/orders')

    await expect(page.getByTestId('orders-unauthenticated')).toBeVisible()
    await expect(page.getByTestId('orders-unauthenticated')).toContainText('Please log in to view your order history.')
  })

  test('TC-002: renders loading state while useOrders is fetching', async ({ page }) => {
    await page.route('/api/auth/login', async route => {
      await route.fulfill({ status: 200, json: { token: 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c2VyLTEiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6OTk5OTk5OTk5OSwiZXhwIjo5OTk5OTk5OTk5fQ.signature' } })
    })

    let resolveOrders: () => void
    const ordersBlocked = new Promise<void>(resolve => { resolveOrders = resolve })

    await page.route('/api/orders*', async route => {
      await ordersBlocked
      await route.fulfill({ status: 200, json: { orders: [] } })
    })

    await page.addInitScript(() => {
      const payload = btoa(JSON.stringify({ userId: 'user-1', email: 'test@example.com', role: 'user', iat: 9999999999, exp: 9999999999 }))
      const token = `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`
      localStorage.setItem('auth_token', token)
    })

    await page.goto('/orders')

    await expect(page.getByTestId('orders-loading')).toBeVisible()

    resolveOrders!()
  })

  test('TC-003: displays error message from useOrders hook', async ({ page }) => {
    await page.addInitScript(() => {
      const payload = btoa(JSON.stringify({ userId: 'user-1', email: 'test@example.com', role: 'user', iat: 9999999999, exp: 9999999999 }))
      const token = `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`
      localStorage.setItem('auth_token', token)
    })

    await page.route('/api/orders*', async route => {
      await route.fulfill({ status: 500, json: { error: 'Failed to load orders' } })
    })

    await page.goto('/orders')

    await expect(page.getByTestId('orders-error')).toBeVisible()
  })

  test('TC-004: renders empty state when orders array is empty', async ({ page }) => {
    await page.addInitScript(() => {
      const payload = btoa(JSON.stringify({ userId: 'user-1', email: 'test@example.com', role: 'user', iat: 9999999999, exp: 9999999999 }))
      const token = `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`
      localStorage.setItem('auth_token', token)
    })

    await page.route('/api/orders*', async route => {
      await route.fulfill({ status: 200, json: { orders: [] } })
    })

    await page.goto('/orders')

    await expect(page.getByTestId('orders-empty')).toBeVisible()
    await expect(page.getByTestId('orders-empty')).toContainText("You haven't placed any orders yet.")
  })

  test('TC-005: renders order cards with formatted ID, date, and status badge', async ({ page }) => {
    await page.addInitScript(() => {
      const payload = btoa(JSON.stringify({ userId: 'user-1', email: 'test@example.com', role: 'user', iat: 9999999999, exp: 9999999999 }))
      const token = `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`
      localStorage.setItem('auth_token', token)
    })

    const orderId = 'abcdef12-3456-7890-abcd-ef1234567890'

    await page.route('/api/orders*', async route => {
      await route.fulfill({
        status: 200,
        json: {
          orders: [
            {
              id: orderId,
              userId: 'user-1',
              items: [
                { productId: 'prod-1', name: 'Test Product', price: 29.99, quantity: 2 }
              ],
              total: 59.98,
              status: 'pending',
              createdAt: '2024-01-15T00:00:00.000Z',
            }
          ]
        }
      })
    })

    await page.goto('/orders')

    await expect(page.getByTestId('order-history')).toBeVisible()
    await expect(page.getByTestId('order-card')).toBeVisible()

    const orderId8 = orderId.slice(0, 8).toUpperCase()
    await expect(page.getByTestId('order-id')).toContainText(orderId8)

    await expect(page.getByTestId('order-date')).toBeVisible()

    await expect(page.getByTestId('order-status')).toBeVisible()
    await expect(page.getByTestId('order-status')).toContainText('Pending')
  })

  test('TC-006: applies correct status badge styles for all OrderStatus values', async ({ page }) => {
    await page.addInitScript(() => {
      const payload = btoa(JSON.stringify({ userId: 'user-1', email: 'test@example.com', role: 'user', iat: 9999999999, exp: 9999999999 }))
      const token = `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`
      localStorage.setItem('auth_token', token)
    })

    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const

    const orders = statuses.map((status, i) => ({
      id: `order-id-${i + 1}0000000`,
      userId: 'user-1',
      items: [],
      total: 0,
      status,
      createdAt: '2024-01-01T00:00:00.000Z',
    }))

    await page.route('/api/orders*', async route => {
      await route.fulfill({ status: 200, json: { orders } })
    })

    await page.goto('/orders')

    await expect(page.getByTestId('order-history')).toBeVisible()

    const statusBadges = page.getByTestId('order-status')
    await expect(statusBadges).toHaveCount(statuses.length)

    const expectedLabels: Record<string, string> = {
      pending:    'Pending',
      processing: 'Processing',
      shipped:    'Shipped',
      delivered:  'Delivered',
      cancelled:  'Cancelled',
    }

    for (let i = 0; i < statuses.length; i++) {
      await expect(statusBadges.nth(i)).toContainText(expectedLabels[statuses[i]])
    }
  })

  test('TC-007: passes authenticated userId to useOrders hook', async ({ page }) => {
    const userId = 'user-42'

    await page.addInitScript((uid) => {
      const payload = btoa(JSON.stringify({ userId: uid, email: 'test@example.com', role: 'user', iat: 9999999999, exp: 9999999999 }))
      const token = `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`
      localStorage.setItem('auth_token', token)
    }, userId)

    let capturedUrl = ''

    await page.route('/api/orders*', async route => {
      capturedUrl = route.request().url()
      await route.fulfill({ status: 200, json: { orders: [] } })
    })

    await page.goto('/orders')

    await expect(page.getByTestId('orders-empty')).toBeVisible()

    expect(capturedUrl).toContain(encodeURIComponent(userId))
  })
})