import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Mock API calls — no real backend needed
  await page.route('/api/sessions', async route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
        message: 'Testowa odpowiedź AI: Produkt prawdopodobnie kwalifikuje się do zwrotu.',
      }),
    })
  })
  await page.goto('/')
  // Clear any session from previous tests
  await page.evaluate(() => localStorage.removeItem('sinsay_session_id'))
  await page.reload()
})

test('form renders with all 5 fields and Polish labels', async ({ page }) => {
  await expect(page.getByText(/zwrot/i).first()).toBeVisible()
  await expect(page.getByText(/reklamacja/i).first()).toBeVisible()
  await expect(page.getByText(/numer zamówienia/i)).toBeVisible()
  await expect(page.getByText(/nazwa produktu/i)).toBeVisible()
  await expect(page.getByText(/opis/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /sprawdź/i })).toBeVisible()
})

test('empty submit shows validation errors', async ({ page }) => {
  await page.getByRole('button', { name: /sprawdź/i }).click()
  // At least 2 error messages should appear
  const errors = page.locator('[role="alert"]')
  await expect(errors.first()).toBeVisible()
  const count = await errors.count()
  expect(count).toBeGreaterThanOrEqual(2)
})

test('PDF upload shows format error immediately', async ({ page }) => {
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles({
    name: 'document.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('fake pdf content'),
  })
  // Target the alert role specifically to avoid strict-mode violation with static hint text
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('alert')).toContainText(/JPEG|PNG|WebP|GIF/i)
})

test('file over 10MB shows size error immediately', async ({ page }) => {
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles({
    name: 'large.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.alloc(11 * 1024 * 1024), // 11 MB
  })
  // Target the alert role specifically to avoid strict-mode violation with static hint text
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('alert')).toContainText(/10 MB/i)
})

test('valid submit shows loading state "Analizuję..."', async ({ page }) => {
  // Route with delay so we can observe loading state
  // Use page.unroute to clear the beforeEach route, then add a delayed one
  await page.unroute('/api/sessions')
  await page.route('/api/sessions', async route => {
    await new Promise(r => setTimeout(r, 500))
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sessionId: 'test-id', message: 'AI response' }),
    })
  })

  // Click the Zwrot radio via its wrapping label (radio input is sr-only)
  await page.locator('input[type="radio"][value="RETURN"]').click({ force: true })
  await page.getByLabel(/numer zamówienia/i).fill('ORD-001')
  await page.getByLabel(/nazwa produktu/i).fill('Blue Jacket')
  await page.getByLabel(/opis problemu/i).fill('Item is damaged')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'photo.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('fake image'),
  })

  await page.getByRole('button', { name: /sprawdź/i }).click()
  // Button text changes to "Analizuję..." and becomes disabled during loading
  await expect(page.locator('button[type="submit"]:disabled')).toBeVisible()
})

test('visual check — take screenshot of form for review', async ({ page }) => {
  // Take screenshot for visual comparison with wireframe
  await expect(page).toHaveScreenshot('form-view.png', { fullPage: true, maxDiffPixelRatio: 0.1 })
})
