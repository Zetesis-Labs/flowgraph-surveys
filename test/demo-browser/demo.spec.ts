import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const startStressRoute = async (page: Page) => {
  await page.getByRole('button', { name: 'Empezar la encuesta' }).click()
  await page.getByLabel(/Cómo te gustaría/).fill('Alex')
  await page.getByLabel('Estrés y sobrecarga').check()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('heading', { name: /sobrecarga/ })).toBeVisible()
}

const finishStressRoute = async (page: Page) => {
  await page.getByLabel(/qué intensidad/).fill('7')
  await page.getByLabel('Trabajo o estudios').check()
  await page.getByLabel(/situación reciente/).fill('Varias entregas coinciden esta semana.')
  await page.getByRole('button', { name: 'Continuar' }).click()

  await page.getByLabel('Videollamada').check()
  await page.getByLabel('Tardes').check()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await page.getByLabel(/minutos podrías reservar entre semana/).fill('30')
  await page.getByLabel(/minutos durante el fin de semana/).fill('20')
  await page.getByLabel('Preguntas concretas y ordenadas').check()
  await expect(page.getByText(/puntuaci|score/i)).toHaveCount(0)
  await page.getByRole('button', { name: 'Continuar' }).click()

  await page.getByLabel('Un horario que pueda moverse').check()
  await page.getByRole('button', { name: 'Continuar' }).click()

  await page.getByLabel(/Qué edad/).fill('32')
  await page.getByLabel(/algo más/).fill('Nada más por ahora.')
  await page.getByRole('button', { name: 'Enviar respuesta' }).click()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('completes, seals, and explicitly replaces a full adaptive journey', async ({ page }) => {
  await startStressRoute(page)
  await finishStressRoute(page)

  await expect(page.getByRole('heading', { name: /Gracias por dedicarte/ })).toBeVisible()
  await expect(page.getByText(/Respuesta guardada localmente/)).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: /Gracias por dedicarte/ })).toBeVisible()

  await page.getByRole('button', { name: /nueva demostración/ }).click()
  const dialog = page.getByRole('dialog', { name: /Empezar desde cero/ })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: /Conservar respuesta/ }).click()
  await expect(page.getByRole('heading', { name: /Gracias por dedicarte/ })).toBeVisible()

  await page.getByRole('button', { name: /nueva demostración/ }).click()
  await dialog.getByRole('button', { name: /Sí, empezar de nuevo/ }).click()
  await expect(page.getByRole('heading', { name: /Cuéntanos cómo estás/ })).toBeVisible()
})

test('restores the current route and preserves backtracking answers', async ({ page }) => {
  await startStressRoute(page)
  await page.getByLabel(/qué intensidad/).fill('6')
  await page.getByLabel('Familia o cuidados').check()
  await page.reload()

  await expect(page.getByRole('heading', { name: /sobrecarga/ })).toBeVisible()
  await expect(page.getByLabel(/qué intensidad/)).toHaveValue('6')
  await expect(page.getByLabel('Familia o cuidados')).toBeChecked()
  await page.getByRole('button', { name: 'Atrás' }).click()
  await expect(page.getByLabel(/Cómo te gustaría/)).toHaveValue('Alex')
  await expect(page.getByLabel('Estrés y sobrecarga')).toBeChecked()
})

test('opens every conditional route from the same fixture entry', async ({ page }) => {
  const routes = [
    ['Descanso y sueño', /Tu descanso últimamente/],
    ['Estrés y sobrecarga', /sobrecarga/],
    ['Un cambio importante', /Sobre ese cambio/],
  ] as const

  for (const [choice, heading] of routes) {
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.getByRole('button', { name: 'Empezar la encuesta' }).click()
    await page.getByLabel(/Cómo te gustaría/).fill('Alex')
    await page.getByLabel(choice).check()
    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  }
})

test('opens every logistical route without displaying its weighted value', async ({ page }) => {
  const routes = [
    {
      weekday: '45',
      weekend: '45',
      styles: ['Preguntas concretas y ordenadas', 'Conversación abierta'],
      request: 'Preparar una conversación concreta',
      detail: 'Quiero salir con una idea clara.',
      heading: /Lo que te gustaría priorizar/,
    },
    {
      weekday: '60',
      weekend: '45',
      styles: ['Conversación abierta', 'Ejemplos y ejercicios prácticos'],
      heading: /Un formato con más espacio/,
    },
    {
      weekday: '30',
      weekend: '20',
      styles: ['Preguntas concretas y ordenadas'],
      heading: /Un formato fácil de encajar/,
    },
  ] as const

  for (const route of routes) {
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await startStressRoute(page)
    await page.getByLabel(/qué intensidad/).fill('5')
    await page.getByLabel('Trabajo o estudios').check()
    await page.getByRole('button', { name: 'Continuar' }).click()
    await page.getByLabel('Videollamada').check()
    await page.getByLabel('Tardes').check()
    await page.getByRole('button', { name: 'Continuar' }).click()

    await page.getByLabel(/minutos podrías reservar entre semana/).fill(route.weekday)
    await page.getByLabel(/minutos durante el fin de semana/).fill(route.weekend)
    for (const style of route.styles) await page.getByLabel(style).check()
    const dimensions = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client)
    if ('request' in route) {
      const request = page.getByLabel(/algo concreto que quieras priorizar/)
      await request.pressSequentially(route.request)
      await page.getByRole('button', { name: 'Continuar' }).click()
      await expect(page.getByLabel(/qué te gustaría poder llevarte/i)).toBeVisible()
      await page.getByLabel(/qué te gustaría poder llevarte/i).pressSequentially(route.detail)
    }
    await expect(page.getByText(/puntuaci|score/i)).toHaveCount(0)
    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page.getByRole('heading', { name: route.heading })).toBeVisible()
    await expect(page.getByText(/puntuaci|score/i)).toHaveCount(0)
  }
})

test('identifies validation problems and remains on the same graph node', async ({ page }) => {
  await page.getByRole('button', { name: 'Empezar la encuesta' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Este campo es obligatorio.')).toHaveCount(2)
  await expect(page.getByLabel(/Cómo te gustaría/)).toBeFocused()
  await expect(page.getByRole('heading', { name: 'Empecemos por ti' })).toBeVisible()
})

test('has no serious accessibility violations on the active survey', async ({ page }) => {
  const serious = (results: Awaited<ReturnType<AxeBuilder['analyze']>>) =>
    results.violations.filter(({ impact }) => impact === 'critical' || impact === 'serious')

  await page.waitForTimeout(500)
  expect(serious(await new AxeBuilder({ page }).analyze())).toEqual([])
  await startStressRoute(page)
  await page.waitForTimeout(500)
  expect(serious(await new AxeBuilder({ page }).analyze())).toEqual([])
  await finishStressRoute(page)
  await page.waitForTimeout(500)
  expect(serious(await new AxeBuilder({ page }).analyze())).toEqual([])
})

test('fits the viewport without horizontal overflow', async ({ page }) => {
  const dimensions = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client)
  await startStressRoute(page)
  const activeDimensions = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }))
  expect(activeDimensions.scroll).toBeLessThanOrEqual(activeDimensions.client)
})
