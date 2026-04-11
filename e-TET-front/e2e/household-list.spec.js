import { test, expect } from '@playwright/test'

test.describe('Household List', () => {
  test.beforeEach(async ({ page }) => {
    // Injetar token e usuário para pular login
    await page.addInitScript(() => {
      window.localStorage.clear()
      window.localStorage.setItem('token', 'fake-test-token')
      window.localStorage.setItem('user', JSON.stringify({ id: '1', usuario: 'tester', role: 'profissional' }))
    })
    
    // Mock simples da lista de domicílios
    await page.route('**/households', async (route) => {
      await route.fulfill({
        json: [
          { id: '1', logradouro: 'Rua de Teste', numero: '100', bairro: 'Centro' },
          { id: '2', logradouro: 'Av Principal', numero: '500', bairro: 'Vila Flora' }
        ]
      })
    })

    await page.goto('/households')
  })

  test('deve listar os domicílios vindo da API', async ({ page }) => {
    await expect(page.getByText('Rua de Teste')).toBeVisible()
    await expect(page.getByText('Av Principal')).toBeVisible()
  })

  test('deve permitir navegar para a criação de novo domicílio via FAB', async ({ page }) => {
    const fabButton = page.getByTestId('add-household-fab')
    await expect(fabButton).toBeVisible()
    await fabButton.click()
    await expect(page).toHaveURL(/.*households\/new/)
  })

  test('deve redirecionar para login se o token for removido', async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await expect(page).toHaveURL(/.*login/)
  })
})
