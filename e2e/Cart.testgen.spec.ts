import { test, expect } from '@playwright/test'

test.describe('Cart component', () => {
  test('TC-005: Cart component calls optional onCheckout callback when Checkout button is clicked', async ({ page }) => {
    await page.goto('/cart-test')

    await expect(page.getByTestId('cart-panel')).toBeVisible()

    const checkoutButton = page.getByRole('button', { name: 'Checkout' })
    await expect(checkoutButton).toBeVisible()
    await checkoutButton.click()

    await expect(page.getByTestId('checkout-called')).toBeVisible()
  })
})

test.describe('OrderHistory component', () => {
  test('TC-006: OrderHistory component fetches orders on mount when isOpen=true using useOrders hook', async ({ page }) => {
    await page.goto('/order-history-test?open=true')

    await expect(page.getByTestId('orders-panel')).toBeVisible()

    await expect(page.getByTestId('order-item').first()).toBeVisible()
  })

  test('TC-007: OrderHistory component renders loading state, error message, and empty state conditionally', async ({ page }) => {
    await page.goto('/order-history-test?open=true&scenario=loading')
    await expect(page.getByTestId('orders-panel')).toBeVisible()
    await expect(page.getByText('Loading')).toBeVisible()

    await page.goto('/order-history-test?open=true&scenario=error')
    await expect(page.getByTestId('orders-panel')).toBeVisible()
    await expect(page.getByText('error')).toBeVisible()

    await page.goto('/order-history-test?open=true&scenario=empty')
    await expect(page.getByTestId('orders-panel')).toBeVisible()
    await expect(page.getByTestId('orders-empty')).toBeVisible()
  })

  test('TC-008: OrderHistory overlay closes and prevents event propagation when background is clicked', async ({ page }) => {
    await page.goto('/order-history-test?open=true')

    await expect(page.getByTestId('orders-panel')).toBeVisible()
    await expect(page.getByTestId('orders-overlay')).toBeVisible()

    await page.getByTestId('orders-overlay').click({ position: { x: 5, y: 5 } })

    await expect(page.getByTestId('orders-panel')).not.toBeVisible()
  })
})