import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function expectUsableModelFallback(page: Page) {
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto('./', { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('.product-scene')).toHaveAttribute('data-renderer-status', 'fallback')
  await expect(page.locator('.product-scene canvas')).toHaveCount(0)

  await page.locator('#finishes').scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'Ember', exact: true }).click()
  const image = page.locator('.product-scene__fallback')
  await expect(image).toHaveAttribute('src', /models\/lucent-fallback-copper\.webp$/)
  await expect.poll(() => image.evaluate(element => element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0)).toBe(true)
  await expect(image).toHaveCSS('opacity', '1')

  const download = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Download the concept sheet' }).click()
  expect((await download).suggestedFilename()).toBe('lucent-concept.txt')
  expect(pageErrors).toEqual([])
}

test('failed projector model fetch retains finish-specific fallback and real download', async ({ page, context }) => {
  let attemptedModelRequests = 0
  await context.route(/\/models\/lucent-projector\.glb(?:\?.*)?$/, route => {
    attemptedModelRequests += 1
    return route.abort('failed')
  })
  await expectUsableModelFallback(page)
  expect(attemptedModelRequests).toBe(1)
})

test('corrupt successful model response preserves the static product fallback', async ({ page, context }) => {
  let attemptedModelRequests = 0
  await context.route(/\/models\/lucent-projector\.glb(?:\?.*)?$/, route => {
    attemptedModelRequests += 1
    return route.fulfill({ status: 200, contentType: 'model/gltf-binary', body: 'not a valid glTF binary' })
  })
  await expectUsableModelFallback(page)
  expect(attemptedModelRequests).toBe(1)
})
