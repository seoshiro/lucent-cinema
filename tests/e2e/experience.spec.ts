import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('complete product story, controls, download and browser health', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('requestfailed', request => errors.push(`${request.method()} ${request.url()} ${request.failure()?.errorText}`))
  page.on('response', response => { if(response.status() >= 400) errors.push(`${response.status()} ${response.url()}`) })
  await page.goto('./', { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Small object.Endless cinema.')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('link', { name: 'Enter the experience' }).click()
  await expect(page).toHaveURL(/#craft$/)
  await expect(page.locator('#craft-title')).toBeInViewport()
  await page.locator('#finishes').scrollIntoViewIfNeeded()
  for (const [name, value] of [['Lunar', 'silver'], ['Ember', 'copper'], ['Obsidian', 'graphite'], ['Lunar', 'silver']]) {
    const choice = page.getByRole('button', { name, exact:true })
    await choice.click()
    await expect(choice).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.product-scene')).toHaveAttribute('data-finish', value)
  }
  await expect.poll(async () => page.locator('.product-scene').evaluate(element => {
    const canvas = element.querySelector('canvas')
    const fallback = element.querySelector('img')
    return Boolean((canvas && Number(getComputedStyle(canvas).opacity) > .9) || (fallback && Number(getComputedStyle(fallback).opacity) > .9))
  })).toBe(true)
  await expect.poll(async () => Number(await page.locator('.cinema-layer').evaluate(el => getComputedStyle(el).opacity))).toBe(0)
  await testInfo.attach('finishes-layout', { body: await page.screenshot(), contentType: 'image/png' })
  await page.locator('#cinema').scrollIntoViewIfNeeded()
  await expect.poll(async () => Number(await page.locator('.cinema-layer').evaluate(el => getComputedStyle(el).opacity))).toBe(1)
  for (const name of ['Afterglow', 'Far beyond', 'Blue hour', 'Afterglow']) {
    const choice = page.getByRole('button', {name,exact:false})
    await choice.click()
    await expect(choice).toHaveAttribute('aria-pressed','true')
  }
  await expect(page.locator('.cinema-world')).toHaveClass(/cinema-world--dune/)
  const pause = page.getByRole('button', { name:'Pause motion', exact:true })
  if(await pause.count()) {
    await pause.click()
    await expect(page.locator('.product-scene')).toHaveAttribute('data-motion','reduced')
    await page.getByRole('button',{name:'Enable motion'}).click()
  }
  await page.locator('#details').scrollIntoViewIfNeeded()
  const download = page.waitForEvent('download')
  await page.getByRole('link',{name:'Download the concept sheet'}).click()
  expect((await download).suggestedFilename()).toBe('lucent-concept.txt')
  await page.getByRole('link',{name:'Back to the light'}).click()
  await expect(page).toHaveURL(/#top$/)
  await expect(page.getByRole('heading',{level:1})).toBeInViewport()
  expect(errors).toEqual([])
  await testInfo.attach('hero', {body:await page.screenshot(),contentType:'image/png'})
})

test('keyboard, accessibility and reduced motion remain usable', async ({ page }, testInfo) => {
  await page.goto('./', {waitUntil:'networkidle'})
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#main$/)
  for(const target of ['#top','#cinema','#finishes','#details']) {
    await page.locator(target).scrollIntoViewIfNeeded()
    const results = await new AxeBuilder({page}).analyze()
    expect(results.violations, JSON.stringify(results.violations,null,2)).toEqual([])
  }
  if(testInfo.project.name === 'reduced-motion') {
    await expect(page.locator('.product-scene')).toHaveAttribute('data-motion','reduced')
    expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto')
  }
})

test('WebGL unavailable preserves the product and all finish controls', async ({ page }) => {
  await page.route(/\/assets\/product-renderer-[^/]+\.js(?:\?.*)?$/, async route => {
    const response = await route.fetch()
    const headers = response.headers()
    delete headers['content-encoding']
    delete headers['content-length']
    // Deliberately emulate unavailable WebGL in the actual renderer worker.
    const injection = `const originalContext = OffscreenCanvas.prototype.getContext;
      Object.defineProperty(OffscreenCanvas.prototype,'getContext',{value:function(type,...args){
        return type==='webgl2' ? null : Reflect.apply(originalContext,this,[type,...args]);
      }});\n`
    await route.fulfill({ status:response.status(), headers, body:injection + await response.text() })
  })
  await page.goto('./',{waitUntil:'networkidle'})
  await expect(page.locator('.product-scene__fallback')).toBeVisible()
  await expect(page.locator('.product-scene')).not.toHaveClass(/ready/)
  await expect(page.locator('.product-scene')).toHaveAttribute('data-renderer-status','fallback')
  await page.locator('#finishes').scrollIntoViewIfNeeded()
  await page.getByRole('button',{name:'Ember',exact:true}).click()
  await expect(page.locator('.product-scene')).toHaveAttribute('data-finish','copper')
  await page.locator('#top').scrollIntoViewIfNeeded()
  await expect.poll(async()=>Number(await page.locator('.product-scene__fallback').evaluate(el=>getComputedStyle(el).opacity))).toBe(1)
})

test('Worker creation failure preserves a usable original fallback', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window,'Worker',{value:class { constructor(){ throw new Error('Simulated unavailable worker') } }})
  })
  await page.goto('./',{waitUntil:'networkidle'})
  await expect(page.locator('.product-scene')).not.toHaveClass(/ready/)
  await expect(page.locator('.product-scene__fallback')).toBeVisible()
  await page.locator('#finishes').scrollIntoViewIfNeeded()
  await page.getByRole('button',{name:'Lunar',exact:true}).click()
  await expect(page.locator('.product-scene')).toHaveAttribute('data-finish','silver')
  await expect.poll(async()=>Number(await page.locator('.product-scene__fallback').evaluate(el=>getComputedStyle(el).opacity))).toBe(1)
})

test('interrupted optional renderer assets preserve the complete product story', async ({ page }) => {
  await page.route(/\/assets\/(?:ProductScene|product-renderer)-[^/]+\.js(?:\?.*)?$/, route => route.abort('failed'))
  await page.goto('./', { waitUntil: 'networkidle' })
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('.product-scene')).toHaveAttribute('data-renderer-status', 'fallback')
  await page.locator('#finishes').scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'Ember', exact: true }).click()
  await expect(page.locator('.product-scene')).toHaveAttribute('data-finish', 'copper')
  const download = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Download the concept sheet' }).click()
  expect((await download).suggestedFilename()).toBe('lucent-concept.txt')
})

test('minimalist artwork waits for the story and stays consistent after world changes', async ({ page }) => {
  const artworkRequests: string[] = []
  page.on('request', request => { if (request.url().includes('/cinema/lucent-minimal-world')) artworkRequests.push(request.url()) })
  await page.goto('./', { waitUntil:'networkidle' })
  expect(artworkRequests).toEqual([])
  await page.locator('#cinema').scrollIntoViewIfNeeded()
  const photo = page.locator('.world-photo img')
  await expect(page.locator('.cinema-world')).toHaveAttribute('data-artwork-status','ready')
  expect(await photo.evaluate(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)).toBe(true)
  expect(await photo.evaluate(image => (image as HTMLImageElement).currentSrc)).toContain(await page.evaluate(() => innerWidth <= 760) ? 'world-mobile.webp' : 'world.webp')
  await page.getByRole('button',{name:'Afterglow',exact:false}).click()
  await expect(page.locator('.cinema-world')).toHaveAttribute('data-artwork-status','procedural')
  await page.getByRole('button',{name:'Blue hour',exact:false}).click()
  await expect(page.locator('.world-photo')).toHaveCSS('opacity','1')
  if (await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)) await expect(page.locator('.world-photo')).toHaveCSS('transform','none')
})

test('unavailable landscape keeps the cinema controls and SVG fallback usable', async ({ page }) => {
  await page.route(/\/cinema\/lucent-minimal-world(?:-mobile)?\.webp$/, route => route.abort('failed'))
  await page.goto('./', { waitUntil:'networkidle' })
  await page.locator('#cinema').scrollIntoViewIfNeeded()
  await expect(page.locator('.cinema-world')).toHaveAttribute('data-artwork-status','fallback')
  await expect(page.locator('.world-photo')).toHaveCount(0)
  await expect(page.locator('.world-art')).toBeVisible()
  await page.getByRole('button',{name:'Far beyond',exact:false}).click()
  await expect(page.locator('.cinema-world')).toHaveClass(/cinema-world--orbit/)
  await page.getByRole('button',{name:'Blue hour',exact:false}).click()
  await expect(page.locator('.world-art')).toBeVisible()
})
