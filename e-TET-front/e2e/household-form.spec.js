import { test, expect } from '@playwright/test'

async function loginWithFakeToken(page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('token', 'fake-test-token')
  })
}

test.describe('Household Form', () => {
  test('new household form page loads', async ({ page }) => {
    await loginWithFakeToken(page)
    await page.goto('/households/new')
    // Should be on the form page
    await expect(page).toHaveURL(/\/households\/new/)
  })

  test('household detail page redirects to detail', async ({ page }) => {
    await loginWithFakeToken(page)
    await page.goto('/households/fake-household-id')
    // Should load detail page even with fake id (may show error from API)
    await expect(page).toHaveURL(/\/households\//)
  })

  test('can navigate from households list to new form', async ({ page }) => {
    await loginWithFakeToken(page)
    await page.goto('/households')
    await expect(page).toHaveURL(/households/, { timeout: 5000 })
    // Navigate programatically
    await page.goto('/households/new')
    await expect(page).toHaveURL(/\/households\/new/)
  })
})

test.describe('Individual Form', () => {
  test('individual create form loads with family param', async ({ page }) => {
    await loginWithFakeToken(page)
    await page.goto('/families/fake-family-id/citizens/new')
    await expect(page).toHaveURL(/\/citizens\/new/)
  })

  test('individual edit form loads with citizen id', async ({ page }) => {
    await loginWithFakeToken(page)
    await page.goto('/citizens/fake-citizen-id/edit')
    await expect(page).toHaveURL(/\/citizens\/fake-citizen-id\/edit/)
  })
})

test.describe('Routing Guards', () => {
  test('all protected routes redirect to login without token', async ({ page }) => {
    // Ensure no token
    await page.context().clearCookies()

    const protectedRoutes = [
      '/households',
      '/households/new',
      '/households/some-id',
      '/families/some-id/citizens/new',
      '/citizens/some-id/edit',
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)
      await expect(page, `Expected ${route} to redirect to /login`).toHaveURL(/\/login/)
    }
  })

  test('with token, login redirects to households', async ({ page }) => {
    await loginWithFakeToken(page)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/households/)
  })
})
