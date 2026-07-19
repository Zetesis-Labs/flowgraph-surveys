import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const expectAccessible = async (page: Page) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
    .analyze()
  expect(results.violations).toEqual([])
}

test('has no automated A/AA violations across the respondent journey', async ({ page }) => {
  await page.goto('/')
  await expectAccessible(page)

  await page.getByRole('button', { name: 'Comenzar' }).click()
  await expectAccessible(page)

  await page.getByRole('button', { name: 'Continuar' }).click()
  await expectAccessible(page)

  await page.getByRole('textbox', { name: /nombre ficticio/i }).fill('Ada')
  await page.getByRole('spinbutton', { name: /edad ficticia/i }).fill('36')
  await page.getByRole('radio', { name: 'Estrés' }).check()
  await page.getByRole('checkbox', { name: 'Teléfono' }).check()
  await expectAccessible(page)

  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('heading', { name: 'Respuesta enviada' })).toBeVisible()
  await expectAccessible(page)
})

test('has no automated A/AA violations for page-level routing friction', async ({ page }) => {
  await page.goto('/?scenario=page-error')
  await page.getByRole('button', { name: 'Comenzar' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByRole('alert')).toContainText(
    'No se puede continuar con las respuestas actuales.',
  )
  await expectAccessible(page)
})
