---
name: Playwright locator patterns for this project's React components
description: Specific locator pitfalls discovered when testing IntakeForm and ChatView
type: feedback
---

**Radio buttons (IntakeForm):** The `<input type="radio">` elements have `className="sr-only"`, making them invisible. `getByRole('radio', { name: /zwrot/i })` fails because the accessible name is not connected. Use `page.locator('input[type="radio"][value="RETURN"]').click({ force: true })` instead.

**File input:** Hidden input, use `page.locator('input[type="file"]')` directly.

**Image upload errors:** The `ImageUpload` component renders static hint text ("Dozwolone formaty: JPEG, PNG, WebP, GIF" and "Maksymalny rozmiar pliku: 10 MB") alongside the dynamic `role="alert"` error. Using `page.getByText(/JPEG.../i)` causes a strict-mode violation (2 matches). Always use `page.getByRole('alert')` to target the error specifically.

**Chat composer input:** `ComposerPrimitive.Input` renders a `textarea` with `aria-hidden="true"`, so `locator('textarea').last()` resolves to a hidden element. Use `page.getByPlaceholder(/zadaj pytanie/i)` instead.

**Submit button loading state:** The submit button has no special role attribute. During loading, text changes to "Analizuję..." and `disabled` is set. Target with `page.locator('button[type="submit"]:disabled')` rather than `getByRole('button', { name: /analizuję/i })` which times out if the Polish character encoding causes issues.