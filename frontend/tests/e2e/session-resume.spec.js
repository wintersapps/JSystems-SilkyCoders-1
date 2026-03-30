import { test, expect } from '@playwright/test'

const SESSION_ID = '550e8400-e29b-41d4-a716-446655440001'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('sinsay_session_id'))
})

test('page reload with valid sessionId shows chat with history', async ({ page }) => {
  // Set sessionId before page load
  await page.evaluate((id) => localStorage.setItem('sinsay_session_id', id), SESSION_ID)

  await page.route(`/api/sessions/${SESSION_ID}`, async route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        session: {
          id: SESSION_ID,
          intent: 'COMPLAINT',
          orderNumber: 'ORD-RESUME',
          productName: 'Red Dress',
          description: 'Wrong color',
          createdAt: new Date().toISOString(),
        },
        messages: [
          { id: '1', role: 'USER', content: 'Mój zwrot', sequenceNumber: 0 },
          { id: '2', role: 'ASSISTANT', content: 'Produkt zakwalifikowany do reklamacji.', sequenceNumber: 1 },
        ],
      }),
    })
  })

  await page.reload()
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('Produkt zakwalifikowany do reklamacji.')).toBeVisible()
})

test('404 on session load clears localStorage and shows form', async ({ page }) => {
  await page.evaluate((id) => localStorage.setItem('sinsay_session_id', id), SESSION_ID)

  await page.route(`/api/sessions/${SESSION_ID}`, async route => {
    route.fulfill({ status: 404, body: '{"error":"Not found"}' })
  })

  await page.reload()
  await expect(page.getByRole('button', { name: /sprawdź/i })).toBeVisible({ timeout: 5000 })
  const stored = await page.evaluate(() => localStorage.getItem('sinsay_session_id'))
  expect(stored).toBeNull()
})

test('form has no horizontal scroll at 375px viewport (TAC-FE-09)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2) // 2px tolerance
})

test('chat has no horizontal scroll at 375px viewport', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((id) => localStorage.setItem('sinsay_session_id', id), SESSION_ID)

  await page.route(`/api/sessions/${SESSION_ID}`, async route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        session: { id: SESSION_ID, intent: 'RETURN', orderNumber: 'ORD-001', productName: 'Jacket', description: 'x', createdAt: new Date().toISOString() },
        messages: [],
      }),
    })
  })

  await page.setViewportSize({ width: 375, height: 812 })
  await page.reload()
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 5000 })
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)
})

test('all key text strings are in Polish', async ({ page }) => {
  await page.goto('/')
  const body = await page.textContent('body')
  // Check for Polish characters/words
  expect(body).toMatch(/zwrot|reklamacja|zamówienia/i)
})

// Final visual audit — screenshots at multiple viewports
test('visual audit — form at 1440px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page).toHaveScreenshot('form-desktop-1440.png', { fullPage: true, maxDiffPixelRatio: 0.1 })
})

test('visual audit — form at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await expect(page).toHaveScreenshot('form-mobile-375.png', { fullPage: true, maxDiffPixelRatio: 0.1 })
})
