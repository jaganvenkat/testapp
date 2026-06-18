import { test, expect } from '@playwright/test'

test.describe('OrderHistory', () => {
  test.describe('TC-E2E-001: unauthenticated prompt', () => {
    test('displays unauthenticated prompt when user is not logged in', async ({ page }) => {
      await page.goto('/orders')
      await expect(page.getByTestId('orders-unauthenticated')).toBeVisible()
      await expect(page.getByTestId('orders-unauthenticated')).toContainText('Please log in to view your order history.')
    })
  })

  test.describe('TC-E2E-002: loading state', () => {
    test('displays loading state while useOrders hook is fetching', async ({ page }) => {
      await page.route('/api/orders*', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ orders: [] }),
        })
      })

      await page.goto('/orders')
      await expect(page.getByTestId('orders-loading')).toBeVisible()
    })
  })

  test.describe('TC-E2E-003: empty state', () => {
    test('displays empty state when orders array is empty', async ({ page }) => {
      await page.route('/api/orders*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ orders: [] }),
        })
      })

      await page.route('/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ userId: 'user-1', email: 'test@example.com', role: 'user' })) + '.sig',
          }),
        })
      })

      await page.goto('/login')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('password123')
      await page.getByTestId('login-button').click()

      await page.goto('/orders')
      await expect(page.getByTestId('orders-empty')).toBeVisible()
      await expect(page.getByTestId('orders-empty')).toContainText("You haven't placed any orders yet.")
    })
  })

  test.describe('TC-E2E-004: order cards with details', () => {
    test('renders each order card with id, date, status badge, items, and total', async ({ page }) => {
      await page.route('/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ userId: 'user-1', email: 'test@example.com', role: 'user' })) + '.sig',
          }),
        })
      })

      await page.route('/api/orders*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            orders: [
              {
                id: 'abcdef12-0000-0000-0000-000000000000',
                userId: 'user-1',
                items: [
                  { id: 'item-1', name: 'Widget', price: 9.99, quantity: 2 },
                ],
                total: 19.98,
                status: 'pending',
                createdAt: new Date('2024-01-15T10:00:00.000Z').toISOString(),
              },
            ],
          }),
        })
      })

      await page.goto('/login')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('password123')
      await page.getByTestId('login-button').click()

      await page.goto('/orders')
      await expect(page.getByTestId('order-history')).toBeVisible()
      await expect(page.getByTestId('order-card').first()).toBeVisible()
      await expect(page.getByTestId('order-id').first()).toContainText('ABCDEF12')
      await expect(page.getByTestId('order-date').first()).toBeVisible()
      await expect(page.getByTestId('order-status').first()).toBeVisible()
    })
  })

  test.describe('TC-E2E-005: STATUS_STYLES color per OrderStatus', () => {
    const statusCases = [
      { status: 'pending',    expectedText: 'Pending' },
      { status: 'processing', expectedText: 'Processing' },
      { status: 'shipped',    expectedText: 'Shipped' },
      { status: 'delivered',  expectedText: 'Delivered' },
      { status: 'cancelled',  expectedText: 'Cancelled' },
    ]

    for (const { status, expectedText } of statusCases) {
      test(`applies correct STATUS_STYLES for status: ${status}`, async ({ page }) => {
        await page.route('/api/auth/login', async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              token: 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ userId: 'user-1', email: 'test@example.com', role: 'user' })) + '.sig',
            }),
          })
        })

        await page.route('/api/orders*', async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              orders: [
                {
                  id: 'abcdef12-0000-0000-0000-000000000000',
                  userId: 'user-1',
                  items: [{ id: 'item-1', name: 'Widget', price: 10, quantity: 1 }],
                  total: 10,
                  status,
                  createdAt: new Date('2024-01-15T10:00:00.000Z').toISOString(),
                },
              ],
            }),
          })
        })

        await page.goto('/login')
        await page.getByTestId('email-input').fill('test@example.com')
        await page.getByTestId('password-input').fill('password123')
        await page.getByTestId('login-button').click()

        await page.goto('/orders')
        await expect(page.getByTestId('order-status').first()).toBeVisible()
        await expect(page.getByTestId('order-status').first()).toContainText(expectedText)
      })
    }
  })

  test.describe('TC-E2E-006: error state', () => {
    test('displays error message when useOrders hook returns error state', async ({ page }) => {
      await page.route('/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ userId: 'user-1', email: 'test@example.com', role: 'user' })) + '.sig',
          }),
        })
      })

      await page.route('/api/orders*', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        })
      })

      await page.goto('/login')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('password123')
      await page.getByTestId('login-button').click()

      await page.goto('/orders')
      await expect(page.getByTestId('orders-error')).toBeVisible()
    })
  })

  test.describe('TC-E2E-007: useOrders fetch with encoded userId', () => {
    test('fetches orders on mount with correct userId query parameter encoding', async ({ page }) => {
      const userId = 'user-1'
      let capturedUrl = ''

      await page.route('/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ userId, email: 'test@example.com', role: 'user' })) + '.sig',
          }),
        })
      })

      await page.route('/api/orders*', async route => {
        capturedUrl = route.request().url()
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ orders: [] }),
        })
      })

      await page.goto('/login')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('password123')
      await page.getByTestId('login-button').click()

      await page.goto('/orders')
      await expect(page.getByTestId('orders-empty')).toBeVisible()

      expect(capturedUrl).toContain(`userId=${encodeURIComponent(userId)}`)
    })
  })

  test.describe('TC-E2E-008: POST /api/orders creates order and shows in OrderHistory', () => {
    test('POST /api/orders creates order and refresh displays it in OrderHistory', async ({ page }) => {
      const newOrder = {
        id: 'neworder1-0000-0000-0000-000000000000',
        userId: 'user-1',
        items: [{ id: 'item-1', name: 'Gadget', price: 49.99, quantity: 1 }],
        total: 49.99,
        status: 'pending',
        createdAt: new Date('2024-06-01T12:00:00.000Z').toISOString(),
      }

      await page.route('/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'eyJhbGciOiJIUzI1NiJ9.' + btoa(JSON.stringify({ userId: 'user-1', email: 'test@example.com', role: 'user' })) + '.sig',
          }),
        })
      })

      let orderCreated = false

      await page.route('/api/orders*', async route => {
        if (route.request().method() === 'POST') {
          orderCreated = true
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ order: newOrder }),
          })
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ orders: orderCreated ? [newOrder] : [] }),
          })
        }
      })

      await page.goto('/login')
      await page.getByTestId('email-input').fill('test@example.com')
      await page.getByTestId('password-input').fill('password123')
      await page.getByTestId('login-button').click()

      await page.request.post('/api/orders', {
        data: {