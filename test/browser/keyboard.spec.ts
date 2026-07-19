import { expect, test } from '@playwright/test'

test('completes the survey by keyboard and keeps controls visible', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Comenzar' }).press('Enter')

  await page.getByRole('textbox', { name: /nombre ficticio/i }).fill('Ada')
  await page.getByRole('spinbutton', { name: /edad ficticia/i }).fill('36')
  await page.getByRole('radio', { name: 'Sueño' }).check()
  await page.getByRole('checkbox', { name: 'Correo' }).check()
  const continueButton = page.getByRole('button', { name: 'Continuar' })
  await expect(continueButton).toBeInViewport()
  await continueButton.press('Enter')

  await expect(page.getByRole('heading', { name: 'Respuesta enviada' })).toBeVisible()

  await page.setViewportSize({ width: 1280, height: 800 })
  await expect(page.getByRole('heading', { name: 'Respuesta enviada' })).toBeInViewport()
})

test('focuses the first problem after rejected navigation', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Comenzar' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByRole('textbox', { name: /nombre ficticio/i })).toBeFocused()
  await expect(page.getByText('Este campo es obligatorio.')).toHaveCount(3)
})

test('accepts every correction after rejected navigation', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Comenzar' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await page.getByRole('textbox', { name: /nombre ficticio/i }).fill('Ada')
  await page.getByRole('spinbutton', { name: /edad ficticia/i }).fill('36')
  await page.getByRole('radio', { name: 'Estrés' }).check()
  await page.getByRole('checkbox', { name: 'Teléfono' }).check()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByRole('heading', { name: 'Respuesta enviada' })).toBeVisible()
})

test('uses native keyboard behavior for choices', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Comenzar' }).press('Enter')

  const sleep = page.getByRole('radio', { name: 'Sueño' })
  const stress = page.getByRole('radio', { name: 'Estrés' })
  await sleep.focus()
  await sleep.press('Space')
  await expect(sleep).toBeChecked()
  await sleep.press('ArrowRight')
  await expect(stress).toBeChecked()

  const email = page.getByRole('checkbox', { name: 'Correo' })
  await email.focus()
  await email.press('Space')
  await expect(email).toBeChecked()
})
