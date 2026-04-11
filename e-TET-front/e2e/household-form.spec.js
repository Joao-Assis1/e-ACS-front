import { test, expect } from '@playwright/test'

test.describe('Household Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear()
      window.localStorage.setItem('token', 'fake-test-token')
      window.localStorage.setItem('user', JSON.stringify({ id: '1', usuario: 'tester', role: 'profissional' }))
    })

    // Mock para salvar domicílio
    await page.route('**/households', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          json: { id: 'new-id-123', logradouro: 'Rua Form', numero: '10' }
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/households/new')
  })

  test('deve preencher as etapas do formulário e salvar um domicílio', async ({ page }) => {
    // Etapa 1: Endereço
    await expect(page.getByText(/Cadastro de imóvel/i)).toBeVisible()
    
    await page.locator('[data-testid="household-microarea"] input').fill('01')
    await page.locator('[data-testid="household-logradouro"] input').fill('Rua de Teste Form')
    await page.locator('[data-testid="household-numero"] input').fill('456')
    await page.locator('[data-testid="household-bairro"] input').fill('Bairro Form')
    
    await page.getByTestId('household-next').click()

    // Etapa 2: Condições de Moradia
    await expect(page.getByText(/Condições de Moradia/i)).toBeVisible()
    await page.locator('[data-testid="household-moradores"] input').fill('2')
    await page.locator('[data-testid="household-comodos"] input').fill('4')
    
    await page.getByTestId('household-next').click()

    // Etapa 3: Infraestrutura & Finalizar
    await expect(page.getByText(/Infraestrutura/i)).toBeVisible()
    await page.getByTestId('household-next').click()

    // Verificação de Redirecionamento (Sucesso)
    // Nota: O app redireciona para o detalhe após salvar
    await expect(page).toHaveURL(/.*households\/[0-9a-f-]+/)
  })

  test('deve validar campos obrigatórios (simulação de erro da API)', async ({ page }) => {
    await page.route('**/households', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          json: { message: 'Campos obrigatórios ausentes' }
        })
      }
    })

    await page.locator('[data-testid="household-microarea"] input').fill('01')
    await page.getByTestId('household-next').click() // Avança para P2
    await page.getByTestId('household-next').click() // Avança para P3
    await page.getByTestId('household-next').click() // Tenta salvar

    // Deve mostrar feedback de erro (global snackbar no AppLayout)
    await expect(page.locator('.v-snackbar')).toBeVisible()
  })
})
