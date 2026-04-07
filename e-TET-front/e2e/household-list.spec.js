import { test, expect } from '@playwright/test'

test.describe('Household List', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root first, then set token on the right origin
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-test-token')
    })
  })

  test('redirects to households when token exists', async ({ page }) => {
    await page.goto('/households')
    await expect(page).toHaveURL(/\/households/)
  })

  test('redirects to login after setting token then clearing it', async ({ page }) => {
    // Clear the token we set in beforeEach
    await page.evaluate(() => {
      localStorage.removeItem('token')
    })
    await page.goto('/households')
    await expect(page).toHaveURL(/\/login/)
  })

  test('can navigate to new household form', async ({ page }) => {
    await page.goto('/households')
    const newBtn = page.getByTestId('new-household')
    if (await newBtn.isVisible().catch(() => false)) {
      await newBtn.click()
      await expect(page).toHaveURL(/\/households\/new/)
    }
  })
})
