import { chromium } from '@playwright/test'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const cache = join(process.env.LOCALAPPDATA, 'ms-playwright')
const executablePath = readdirSync(cache).filter(name => /^chromium-\d+$/.test(name)).sort((a,b) => Number(b.split('-')[1])-Number(a.split('-')[1])).map(name => join(cache,name,'chrome-win64','chrome.exe')).find(existsSync)
const browser = await chromium.launch({ executablePath, headless: true })
const captureURL = process.argv[2] || process.env.CAPTURE_URL || 'http://127.0.0.1:5173'
const prefix = process.argv[3] || 'root'
if(!/^[a-z0-9-]+$/.test(prefix)) throw new Error('Capture prefix must be a simple filename label')
mkdirSync('screenshots', { recursive:true })
const results = []
for (const size of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844}]) {
  const page = await browser.newPage({ viewport:size, deviceScaleFactor:1 })
  const errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
  page.on('requestfailed',request=>errors.push(`${request.method()} ${request.url()} ${request.failure()?.errorText}`))
  await page.goto(captureURL, {waitUntil:'networkidle'})
  await page.locator('.product-scene--ready').waitFor({timeout:15_000})
  const settle = async () => page.evaluate(() => new Promise(resolve => {
    let frames=0
    function next(){ if(++frames>=70)resolve(true);else requestAnimationFrame(next) }
    requestAnimationFrame(next)
  }))
  await settle()
  await page.screenshot({path:`screenshots/${prefix}-hero-${size.name}.png`})
  results.push({name:size.name,ready:await page.locator('.product-scene').getAttribute('class'),errors,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)})
  if(size.name==='desktop') for(const id of ['craft','optics','cinema','finishes','details']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded()
    await settle()
    await page.screenshot({path:`screenshots/${prefix}-${id}-${size.name}.png`})
  }
  await page.close()
}
await browser.close()
writeFileSync(`reports/${prefix}-capture.json`,JSON.stringify({url:captureURL,results},null,2))
console.log(JSON.stringify(results,null,2))
