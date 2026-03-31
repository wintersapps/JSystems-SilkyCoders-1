import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// Ensure logs directory exists
const logsDir = path.resolve('../../logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Ensure screenshots directory exists
const screenshotsDir = path.resolve('tests/e2e/screenshots')
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true })
}

function log(testName, step, message) {
  const timestamp = new Date().toISOString()
  const line = `[${timestamp}] [${testName}] [${step}] ${message}\n`
  fs.appendFileSync(path.resolve('../../logs/e2e-tests.log'), line)
}

const IMAGE_JPEG = path.resolve('../../assets/example-images/cloth2.jpg')

// Real sessionId created via form submit in beforeAll
let realSessionId = null

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage()
  log('beforeAll', 'setup', 'Creating real session via form submit')

  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('sinsay_session_id'))
  await page.reload()

  // Fill and submit form to create a real session
  await page.locator('input[type="radio"][value="RETURN"]').click({ force: true })
  await page.getByLabel(/numer zamówienia/i).fill('ORD-RESUME-001')
  await page.getByLabel(/nazwa produktu/i).fill('Red Dress')
  await page.getByLabel(/opis problemu/i).fill('Rozmiar nie pasuje, proszę o zwrot.')
  await page.locator('input[type="file"]').setInputFiles(IMAGE_JPEG)
  await page.getByRole('button', { name: /sprawdź/i }).click()

  // Wait for chat view and read sessionId from localStorage
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 15000 })
  realSessionId = await page.evaluate(() => localStorage.getItem('sinsay_session_id'))

  log('beforeAll', 'setup', `Real session created: ${realSessionId}`)
  await page.close()
})

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('sinsay_session_id'))
})

test('page reload with valid sessionId shows chat with history', async ({ page }) => {
  const testName = 'session-resume'
  log(testName, 'start', `Resuming session: ${realSessionId}`)

  expect(realSessionId).not.toBeNull()

  log(testName, 'setup', 'Setting sessionId in localStorage')
  await page.evaluate((id) => localStorage.setItem('sinsay_session_id', id), realSessionId)

  log(testName, 'action', 'Reloading page')
  await page.reload()

  log(testName, 'assert', 'Verifying chat view is shown')
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 10000 })

  log(testName, 'screenshot', 'Taking screenshot of resumed session')
  await page.screenshot({ path: 'tests/e2e/screenshots/session-resume-chat.png', fullPage: true })

  log(testName, 'done', 'Test passed')
})

test('404 on session load clears localStorage and shows form', async ({ page }) => {
  const testName = 'session-404'
  const nonExistentId = '00000000-0000-0000-0000-000000000001'
  log(testName, 'start', `Using non-existent sessionId: ${nonExistentId}`)

  await page.evaluate((id) => localStorage.setItem('sinsay_session_id', id), nonExistentId)

  log(testName, 'action', 'Reloading page — real backend will return 404')
  await page.reload()

  log(testName, 'assert', 'Verifying form is shown after 404')
  await expect(page.getByRole('button', { name: /sprawdź/i })).toBeVisible({ timeout: 10000 })

  log(testName, 'assert', 'Verifying localStorage is cleared')
  const stored = await page.evaluate(() => localStorage.getItem('sinsay_session_id'))
  expect(stored).toBeNull()

  log(testName, 'done', 'Test passed')
})

test('form has no horizontal scroll at 375px viewport (TAC-FE-09)', async ({ page }) => {
  const testName = 'responsive-form-375'
  log(testName, 'start', 'Test started')

  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  log(testName, 'assert', `scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)

  log(testName, 'done', 'Test passed')
})

test('chat has no horizontal scroll at 375px viewport', async ({ page }) => {
  const testName = 'responsive-chat-375'
  log(testName, 'start', `Using real sessionId: ${realSessionId}`)

  expect(realSessionId).not.toBeNull()
  await page.evaluate((id) => localStorage.setItem('sinsay_session_id', id), realSessionId)
  await page.setViewportSize({ width: 375, height: 812 })
  await page.reload()

  log(testName, 'wait', 'Waiting for chat view')
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 10000 })

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  log(testName, 'assert', `scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)

  log(testName, 'done', 'Test passed')
})

test('all key text strings are in Polish', async ({ page }) => {
  const testName = 'polish-text'
  log(testName, 'start', 'Test started')

  await page.goto('/')
  const body = await page.textContent('body')
  expect(body).toMatch(/zwrot|reklamacja|zamówienia/i)

  log(testName, 'done', 'Test passed')
})

test('visual audit — form at 1440px', async ({ page }) => {
  const testName = 'visual-form-1440'
  log(testName, 'start', 'Test started')

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  await page.screenshot({ path: 'tests/e2e/screenshots/form-desktop-1440.png', fullPage: true })
  await expect(page).toHaveScreenshot('form-desktop-1440.png', { fullPage: true, maxDiffPixelRatio: 0.1 })

  log(testName, 'done', 'Test passed')
})

test('visual audit — form at 375px', async ({ page }) => {
  const testName = 'visual-form-375'
  log(testName, 'start', 'Test started')

  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  await page.screenshot({ path: 'tests/e2e/screenshots/form-mobile-375.png', fullPage: true })
  await expect(page).toHaveScreenshot('form-mobile-375.png', { fullPage: true, maxDiffPixelRatio: 0.1 })

  log(testName, 'done', 'Test passed')
})
