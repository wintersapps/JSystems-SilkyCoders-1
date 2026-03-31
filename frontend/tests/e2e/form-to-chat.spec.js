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
const IMAGE_WEBP = path.resolve('../../assets/example-images/cloth1.webp')

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('sinsay_session_id'))
  await page.reload()
})

async function fillAndSubmitForm(page, imagePath, testName) {
  log(testName, 'fill-form', 'Clicking RETURN radio')
  await page.locator('input[type="radio"][value="RETURN"]').click({ force: true })

  log(testName, 'fill-form', 'Filling order number')
  await page.getByLabel(/numer zamówienia/i).fill('ORD-E2E-001')

  log(testName, 'fill-form', 'Filling product name')
  await page.getByLabel(/nazwa produktu/i).fill('Blue Jacket')

  log(testName, 'fill-form', 'Filling description')
  await page.getByLabel(/opis problemu/i).fill('Produkt jest uszkodzony, proszę o zwrot.')

  log(testName, 'fill-form', `Uploading image: ${imagePath}`)
  await page.locator('input[type="file"]').setInputFiles(imagePath)

  log(testName, 'fill-form', 'Submitting form')
  await page.getByRole('button', { name: /sprawdź/i }).click()
}

test('form submit with JPEG transitions to chat and receives AI response', async ({ page }) => {
  const testName = 'form-submit-jpeg'
  log(testName, 'start', 'Test started')

  await fillAndSubmitForm(page, IMAGE_JPEG, testName)

  log(testName, 'wait', 'Waiting for chat view (Nowa sesja button)')
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 15000 })

  log(testName, 'wait', 'Waiting for AI assistant response (LLM streaming, 30s timeout)')
  await expect(page.locator('[data-message-role="assistant"]').first()).toBeVisible({ timeout: 30000 })

  log(testName, 'screenshot', 'Taking screenshot of chat view')
  await page.screenshot({ path: 'tests/e2e/screenshots/chat-view-jpeg.png', fullPage: true })

  log(testName, 'done', 'Test passed')
})

test('form submit with WebP (edge case) transitions to chat and receives AI response', async ({ page }) => {
  const testName = 'form-submit-webp'
  log(testName, 'start', 'Test started')

  await fillAndSubmitForm(page, IMAGE_WEBP, testName)

  log(testName, 'wait', 'Waiting for chat view (Nowa sesja button)')
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 15000 })

  log(testName, 'wait', 'Waiting for AI assistant response (LLM streaming, 30s timeout)')
  await expect(page.locator('[data-message-role="assistant"]').first()).toBeVisible({ timeout: 30000 })

  log(testName, 'screenshot', 'Taking screenshot of chat view with WebP image')
  await page.screenshot({ path: 'tests/e2e/screenshots/chat-view-webp.png', fullPage: true })

  log(testName, 'done', 'Test passed')
})

test('sessionId is stored in localStorage after form submit', async ({ page }) => {
  const testName = 'session-id-stored'
  log(testName, 'start', 'Test started')

  await fillAndSubmitForm(page, IMAGE_JPEG, testName)

  log(testName, 'wait', 'Waiting for chat view')
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 15000 })

  log(testName, 'assert', 'Checking sessionId in localStorage')
  const sessionId = await page.evaluate(() => localStorage.getItem('sinsay_session_id'))
  expect(sessionId).not.toBeNull()
  expect(sessionId).toMatch(/^[0-9a-f-]{36}$/)

  log(testName, 'done', `Test passed — sessionId: ${sessionId}`)
})

test('"Nowa sesja" returns to form and clears localStorage', async ({ page }) => {
  const testName = 'nowa-sesja-clears'
  log(testName, 'start', 'Test started')

  await fillAndSubmitForm(page, IMAGE_JPEG, testName)

  log(testName, 'wait', 'Waiting for chat view')
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 15000 })

  log(testName, 'action', 'Clicking Nowa sesja')
  await page.getByRole('button', { name: /nowa sesja/i }).click()

  log(testName, 'assert', 'Verifying form is shown')
  await expect(page.getByRole('button', { name: /sprawdź/i })).toBeVisible()

  log(testName, 'assert', 'Verifying localStorage cleared')
  const sessionId = await page.evaluate(() => localStorage.getItem('sinsay_session_id'))
  expect(sessionId).toBeNull()

  log(testName, 'done', 'Test passed')
})

test('chat input is visible after form submit', async ({ page }) => {
  const testName = 'chat-input-visible'
  log(testName, 'start', 'Test started')

  await fillAndSubmitForm(page, IMAGE_JPEG, testName)

  log(testName, 'wait', 'Waiting for chat view')
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 15000 })

  log(testName, 'assert', 'Verifying chat composer input is visible')
  await expect(page.getByPlaceholder(/zadaj pytanie/i)).toBeVisible()

  log(testName, 'done', 'Test passed')
})

test('visual check — screenshot of chat view for review', async ({ page }) => {
  const testName = 'visual-chat'
  log(testName, 'start', 'Test started')

  await fillAndSubmitForm(page, IMAGE_JPEG, testName)

  log(testName, 'wait', 'Waiting for chat view')
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 15000 })

  log(testName, 'screenshot', 'Taking visual regression screenshot')
  await page.screenshot({ path: 'tests/e2e/screenshots/chat-view-visual.png', fullPage: true })
  await expect(page).toHaveScreenshot('chat-view.png', { fullPage: true, maxDiffPixelRatio: 0.1 })

  log(testName, 'done', 'Test passed')
})
