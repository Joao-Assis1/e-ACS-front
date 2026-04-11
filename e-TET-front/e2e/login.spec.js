import { test, expect } from '@playwright/test'

test.describe('Portal de Login e-TET', () => {
  test.beforeEach(async ({ page }) => {
    // Garantir estado limpo para evitar redirecionamentos automáticos
    await page.addInitScript(() => window.localStorage.clear())
    await page.goto('/login')
  })

  test('deve exibir elementos essenciais da tela de login', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'e-TET' })).toBeVisible()
    await expect(page.getByText('Território Eletrônico')).toBeVisible()
    await expect(page.getByPlaceholder(/usuário/i)).toBeVisible()
    await expect(page.getByPlaceholder(/senha/i)).toBeVisible()
    await expect(page.getByTestId('login-submit')).toBeVisible()
  })

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    // Interceptar para simular erro se o backend não estiver rodando ou para teste isolado
    // Mas aqui vamos testar o comportamento da UI
    await page.getByPlaceholder(/usuário/i).fill('usuario.invalido')
    await page.getByPlaceholder(/senha/i).fill('wrong')
    await page.getByTestId('login-submit').click()

    await expect(page.locator('.v-snackbar')).toContainText(/Inválido/i)
  })

  test('deve realizar login com sucesso e navegar para Domicílios', async ({ page }) => {
    await page.getByPlaceholder(/usuário/i).fill('acs_maria')
    await page.getByPlaceholder(/senha/i).fill('123')
    await page.getByTestId('login-submit').click()

    await expect(page).toHaveURL(/.*households/)
    await expect(page.getByText('acs_maria')).toBeVisible()
  })

  test('deve permitir alternar visibilidade da senha', async ({ page }) => {
    const passwordInput = page.getByPlaceholder(/senha/i)
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    await page.click('[aria-label="appended action"]') // O ícone de olho no Vuetify
    await expect(passwordInput).toHaveAttribute('type', 'text')
  })
})
