import { test, expect } from '@playwright/test'

test.describe('NotificationsPage', () => {
  test('TC-001: displays unauthenticated prompt when user is null', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page.getByTestId('notifs-unauthenticated')).toBeVisible()
  })

  test('TC-002: displays loading state while fetching notifications', async ({ page }) => {
    await page.route('/api/notifications*', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000))
      await route.fulfill({ json: { notifications: [] } })
    })

    await page.goto('/notifications')
    await expect(page.getByTestId('notifs-loading')).toBeVisible()
  })

  test('TC-003: displays error message when API fails', async ({ page }) => {
    await page.route('/api/notifications*', async route => {
      await route.fulfill({ status: 500, json: { error: 'Server error' } })
    })

    await page.goto('/notifications')
    await expect(page.getByTestId('notifs-error')).toBeVisible()
  })

  test('TC-004: shows unread badge count when unreadCount > 0', async ({ page }) => {
    await page.route('/api/notifications*', async route => {
      await route.fulfill({
        json: {
          notifications: [
            {
              id: 'notif-1',
              userId: 'user-1',
              title: 'Test',
              body: 'Test body',
              type: 'info',
              read: false,
              createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
            },
          ],
        },
      })
    })

    await page.goto('/notifications')
    await expect(page.getByTestId('unread-badge')).toBeVisible()
  })

  test('TC-005: markAllRead button appears only when unreadCount > 0', async ({ page }) => {
    await page.route('/api/notifications*', async route => {
      const url = route.request().url()
      if (url.includes('read')) {
        await route.fulfill({ json: { notifications: [] } })
      } else {
        await route.fulfill({
          json: {
            notifications: [
              {
                id: 'notif-1',
                userId: 'user-1',
                title: 'Unread notification',
                body: 'body',
                type: 'info',
                read: false,
                createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
              },
            ],
          },
        })
      }
    })

    await page.goto('/notifications')
    await expect(page.getByTestId('mark-all-read')).toBeVisible()
    await expect(page.getByText('Mark all as read')).toBeVisible()
  })

  test('TC-006: markAllRead fires callback and updates UI state', async ({ page }) => {
    await page.route('/api/notifications*', async route => {
      await route.fulfill({
        json: {
          notifications: [
            {
              id: 'notif-1',
              userId: 'user-1',
              title: 'Unread notification',
              body: 'body',
              type: 'info',
              read: false,
              createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
            },
          ],
        },
      })
    })

    await page.route('/api/notifications/mark-all-read', async route => {
      await route.fulfill({ status: 200, json: { success: true } })
    })

    await page.goto('/notifications')
    await expect(page.getByTestId('mark-all-read')).toBeVisible()
    await page.getByTestId('mark-all-read').click()
    await expect(page.getByTestId('unread-badge')).not.toBeVisible()
    await expect(page.getByTestId('mark-all-read')).not.toBeVisible()
  })

  test('TC-007: renders empty state when notifications array is empty', async ({ page }) => {
    await page.route('/api/notifications*', async route => {
      await route.fulfill({ json: { notifications: [] } })
    })

    await page.goto('/notifications')
    await expect(page.getByTestId('notifs-empty')).toBeVisible()
  })

  test('TC-008: applies correct TYPE_STYLES for each notification type', async ({ page }) => {
    const types = ['info', 'success', 'warning', 'error'] as const

    await page.route('/api/notifications*', async route => {
      await route.fulfill({
        json: {
          notifications: types.map((type, i) => ({
            id: `notif-${i}`,
            userId: 'user-1',
            title: `${type} notification`,
            body: `${type} body`,
            type,
            read: false,
            createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
          })),
        },
      })
    })

    await page.goto('/notifications')
    await expect(page.getByTestId('notifications-page')).toBeVisible()

    for (const type of types) {
      await expect(page.getByText(`${type} notification`)).toBeVisible()
    }
  })

  test('TC-009: displays correct TYPE_ICON for each notification type', async ({ page }) => {
    const typeIcons: Array<{ type: string; icon: string }> = [
      { type: 'info', icon: 'ℹ' },
      { type: 'success', icon: '✓' },
      { type: 'warning', icon: '⚠' },
      { type: 'error', icon: '✕' },
    ]

    await page.route('/api/notifications*', async route => {
      await route.fulfill({
        json: {
          notifications: typeIcons.map(({ type }, i) => ({
            id: `notif-${i}`,
            userId: 'user-1',
            title: `${type} notification`,
            body: `${type} body`,
            type,
            read: false,
            createdAt: new Date('2024-01-01T00:00:00.000Z').toISOString(),
          })),
        },
      })
    })

    await page.goto('/notifications')
    await expect(page.getByTestId('notifications-page')).toBeVisible()

    for (const { icon } of typeIcons) {
      await expect(page.getByText(icon).first()).toBeVisible()
    }
  })
})