import { expect, test } from '@playwright/test'

test('renders a warmed committed action in under 100 milliseconds', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Comenzar' }).click()
  const sleep = page.getByRole('radio', { name: 'Sueño' })
  const stress = page.getByRole('radio', { name: 'Estrés' })

  await sleep.click()
  await expect(sleep).toBeChecked()

  const durations: number[] = []
  for (const option of [stress, sleep, stress, sleep, stress]) {
    durations.push(
      await option.evaluate(async (element) => {
        if (!(element instanceof HTMLInputElement)) throw new Error('Expected a radio input')
        const start = performance.now()
        element.click()
        while (!element.checked) {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
        }
        return performance.now() - start
      }),
    )
  }

  expect(Math.max(...durations)).toBeLessThan(100)
})
