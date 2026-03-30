import { test, expect } from '@playwright/test'

const SESSION_ID = '550e8400-e29b-41d4-a716-446655440000'
const AI_MESSAGE = 'Produkt prawdopodobnie kwalifikuje się do zwrotu. Ocena niewiążąca.'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('sinsay_session_id'))

  await page.route('/api/sessions', async route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sessionId: SESSION_ID, message: AI_MESSAGE }),
    })
  })

  // Mock streaming endpoint
  await page.route(`/api/sessions/${SESSION_ID}/messages`, async route => {
    route.fulfill({
      status: 200,
      contentType: 'text/plain;charset=UTF-8',
      headers: { 'X-Vercel-AI-Data-Stream': 'v1' },
      body: '0:"Dodatkowa odpowiedź AI"\nd:{"finishReason":"stop"}\n',
    })
  })

  await page.reload()
})

async function fillAndSubmitForm(page) {
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
}

test('form submit transitions to chat view with AI message', async ({ page }) => {
  await fillAndSubmitForm(page)
  // Chat view should appear
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 5000 })
})

test('sessionId is stored in localStorage after form submit', async ({ page }) => {
  await fillAndSubmitForm(page)
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 5000 })
  const sessionId = await page.evaluate(() => localStorage.getItem('sinsay_session_id'))
  expect(sessionId).toBe(SESSION_ID)
})

test('"Nowa sesja" returns to form and clears localStorage', async ({ page }) => {
  await fillAndSubmitForm(page)
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: /nowa sesja/i }).click()
  await expect(page.getByRole('button', { name: /sprawdź/i })).toBeVisible()
  const sessionId = await page.evaluate(() => localStorage.getItem('sinsay_session_id'))
  expect(sessionId).toBeNull()
})

test('chat input is visible after form submit', async ({ page }) => {
  await fillAndSubmitForm(page)
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 5000 })
  // Chat should have a composer input area — target by placeholder text
  await expect(page.getByPlaceholder(/zadaj pytanie/i)).toBeVisible()
})

test('visual check — take screenshot of chat view for review', async ({ page }) => {
  await fillAndSubmitForm(page)
  await expect(page.getByRole('button', { name: /nowa sesja/i })).toBeVisible({ timeout: 5000 })
  await expect(page).toHaveScreenshot('chat-view.png', { fullPage: true, maxDiffPixelRatio: 0.1 })
})
