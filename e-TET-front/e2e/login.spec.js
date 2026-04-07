import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should redirect to /login when not authenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('should display login form elements', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('e-TET')).toBeVisible()
    await expect(page.getByText('Território Eletrônico')).toBeVisible()
    await expect(page.getByTestId('login-username')).toBeVisible()
    await expect(page.getByTestId('login-password')).toBeVisible()
    await expect(page.getByTestId('login-submit')).toBeVisible()
  })

  test('should block access to protected routes without token', async ({ page }) => {
    await page.goto('/households')
    await expect(page).toHaveURL(/\/login/)
  })
})
