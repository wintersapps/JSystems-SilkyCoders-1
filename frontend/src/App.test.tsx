import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import App from './App'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

describe('App', () => {
  // No sessionId → shows form
  it('renders IntakeForm when no session in localStorage', () => {
    render(<App />)
    // IntakeForm has a submit button with "Sprawdź" text
    expect(screen.getByRole('button', { name: /sprawdź/i })).toBeInTheDocument()
  })

  // sessionId in localStorage → loads ChatView
  it('renders ChatView when valid sessionId in localStorage', async () => {
    const sessionId = '00000000-0000-0000-0000-000000000001'
    localStorage.setItem('sinsay_session_id', sessionId)

    server.use(
      http.get(`/api/sessions/${sessionId}`, () =>
        HttpResponse.json({
          session: {
            id: sessionId,
            intent: 'RETURN',
            orderNumber: 'ORD-001',
            productName: 'Blue Jacket',
            description: 'damaged',
            createdAt: new Date().toISOString(),
          },
          messages: [],
        }),
      ),
    )

    render(<App />)
    // ChatView shows "Nowa sesja" button
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /nowa sesja/i }),
      ).toBeInTheDocument(),
    )
  })

  // 404 on session load → back to form
  it('shows IntakeForm when session GET returns 404', async () => {
    const sessionId = '00000000-0000-0000-0000-000000000002'
    localStorage.setItem('sinsay_session_id', sessionId)

    server.use(
      http.get(`/api/sessions/${sessionId}`, () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    )

    render(<App />)
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /sprawdź/i }),
      ).toBeInTheDocument(),
    )
    expect(localStorage.getItem('sinsay_session_id')).toBeNull()
  })

  // "Nowa sesja" → back to form
  it('switches back to IntakeForm and clears localStorage when onNewSession called', async () => {
    const sessionId = '00000000-0000-0000-0000-000000000003'
    localStorage.setItem('sinsay_session_id', sessionId)

    server.use(
      http.get(`/api/sessions/${sessionId}`, () =>
        HttpResponse.json({
          session: {
            id: sessionId,
            intent: 'RETURN',
            orderNumber: 'ORD-001',
            productName: 'Jacket',
            description: 'x',
            createdAt: new Date().toISOString(),
          },
          messages: [],
        }),
      ),
    )

    const user = userEvent.setup()
    render(<App />)

    await waitFor(() => screen.getByRole('button', { name: /nowa sesja/i }))
    await user.click(screen.getByRole('button', { name: /nowa sesja/i }))

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /sprawdź/i }),
      ).toBeInTheDocument(),
    )
    expect(localStorage.getItem('sinsay_session_id')).toBeNull()
  })
})
