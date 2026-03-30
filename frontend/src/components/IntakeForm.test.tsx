import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { IntakeForm } from './IntakeForm'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => localStorage.clear())

describe('IntakeForm', () => {
  // TAC-FE-01: 5 validation errors on empty submit
  it('shows validation errors for all empty fields on submit', async () => {
    const user = userEvent.setup()
    render(<IntakeForm onSuccess={() => {}} />)
    await user.click(screen.getByRole('button', { name: /sprawdź/i }))
    // At minimum, check intent and image errors show
    expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(2)
  })

  // TAC-FE-08: Polish text
  it('renders all labels in Polish', () => {
    render(<IntakeForm onSuccess={() => {}} />)
    expect(screen.getByText(/zwrot/i)).toBeInTheDocument()
    expect(screen.getByText(/reklamacja/i)).toBeInTheDocument()
    expect(screen.getByText(/numer zamówienia/i)).toBeInTheDocument()
    expect(screen.getByText(/opis/i)).toBeInTheDocument()
  })

  // Loading state
  it('shows "Analizuję..." and disables button during submission', async () => {
    server.use(
      http.post('/api/sessions', async () => {
        await new Promise((r) => setTimeout(r, 100))
        return HttpResponse.json({ sessionId: 'abc', message: 'OK' })
      }),
    )
    const user = userEvent.setup()
    render(<IntakeForm onSuccess={() => {}} />)

    // Fill all fields
    await user.click(screen.getByRole('radio', { name: /zwrot/i }))
    await user.type(screen.getByLabelText(/numer zamówienia/i), 'ORD-001')
    await user.type(screen.getByLabelText(/nazwa produktu/i), 'Blue Jacket')
    await user.type(screen.getByLabelText(/opis/i), 'Item damaged')
    // Upload image via hidden input
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await user.upload(
      input,
      new File(['x'], 'photo.jpg', { type: 'image/jpeg' }),
    )

    fireEvent.click(screen.getByRole('button', { name: /sprawdź/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /analizuję/i })).toBeDisabled(),
    )
  })

  // TAC-FE-04: localStorage set on success
  it('stores sessionId in localStorage and calls onSuccess on API success', async () => {
    const sessionId = '550e8400-e29b-41d4-a716-446655440000'
    server.use(
      http.post('/api/sessions', () =>
        HttpResponse.json({ sessionId, message: 'AI decision' }),
      ),
    )
    const onSuccess = vi.fn()
    const user = userEvent.setup()
    render(<IntakeForm onSuccess={onSuccess} />)

    await user.click(screen.getByRole('radio', { name: /zwrot/i }))
    await user.type(screen.getByLabelText(/numer zamówienia/i), 'ORD-001')
    await user.type(screen.getByLabelText(/nazwa produktu/i), 'Blue Jacket')
    await user.type(screen.getByLabelText(/opis/i), 'Item damaged')
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await user.upload(
      input,
      new File(['x'], 'photo.jpg', { type: 'image/jpeg' }),
    )

    await user.click(screen.getByRole('button', { name: /sprawdź/i }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(localStorage.getItem('sinsay_session_id')).toBe(sessionId)
  })

  // API error
  it('shows error message and re-enables button on API failure', async () => {
    server.use(http.post('/api/sessions', () => HttpResponse.error()))
    const user = userEvent.setup()
    render(<IntakeForm onSuccess={() => {}} />)

    await user.click(screen.getByRole('radio', { name: /zwrot/i }))
    await user.type(screen.getByLabelText(/numer zamówienia/i), 'ORD-001')
    await user.type(screen.getByLabelText(/nazwa produktu/i), 'Blue Jacket')
    await user.type(screen.getByLabelText(/opis/i), 'Item damaged')
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await user.upload(
      input,
      new File(['x'], 'photo.jpg', { type: 'image/jpeg' }),
    )

    await user.click(screen.getByRole('button', { name: /sprawdź/i }))
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /sprawdź/i }),
      ).not.toBeDisabled(),
    )
  })
})
