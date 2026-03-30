import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { ChatView } from './ChatView'

const server = setupServer()
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const sessionInfo = {
  sessionId: '00000000-0000-0000-0000-000000000001',
  intent: 'RETURN' as const,
  orderNumber: 'ORD-001',
  productName: 'Blue Jacket',
}

describe('ChatView', () => {
  it('renders summary bar with session info', () => {
    render(
      <ChatView
        {...sessionInfo}
        initialMessages={[]}
        onNewSession={() => {}}
      />,
    )
    expect(screen.getByText('ORD-001')).toBeInTheDocument()
    expect(screen.getByText('Blue Jacket')).toBeInTheDocument()
  })

  it('renders initial messages', () => {
    render(
      <ChatView
        {...sessionInfo}
        initialMessages={[
          {
            id: '1',
            role: 'user',
            content: [{ type: 'text', text: 'My question' }],
          },
          {
            id: '2',
            role: 'assistant',
            content: [{ type: 'text', text: 'AI answer' }],
          },
        ]}
        onNewSession={() => {}}
      />,
    )
    expect(screen.getByText('My question')).toBeInTheDocument()
    expect(screen.getByText('AI answer')).toBeInTheDocument()
  })

  it('calls onNewSession when "Nowa sesja" button clicked', async () => {
    const user = userEvent.setup()
    const onNewSession = vi.fn()
    render(
      <ChatView
        {...sessionInfo}
        initialMessages={[]}
        onNewSession={onNewSession}
      />,
    )
    await user.click(screen.getByRole('button', { name: /nowa sesja/i }))
    expect(onNewSession).toHaveBeenCalled()
  })

  it('loads session history on mount when initialMessages is null', async () => {
    server.use(
      http.get('/api/sessions/00000000-0000-0000-0000-000000000001', () =>
        HttpResponse.json({
          session: {
            id: '00000000-0000-0000-0000-000000000001',
            intent: 'RETURN',
            orderNumber: 'ORD-001',
            productName: 'Blue Jacket',
            description: 'damaged',
            createdAt: new Date().toISOString(),
          },
          messages: [
            {
              id: '1',
              role: 'USER',
              content: 'Loaded question',
              sequenceNumber: 0,
            },
            {
              id: '2',
              role: 'ASSISTANT',
              content: 'Loaded answer',
              sequenceNumber: 1,
            },
          ],
        }),
      ),
    )
    render(
      <ChatView
        {...sessionInfo}
        initialMessages={null}
        onNewSession={() => {}}
      />,
    )
    await waitFor(() =>
      expect(screen.getByText('Loaded answer')).toBeInTheDocument(),
    )
  })

  it('calls onNewSession when session GET returns 404', async () => {
    server.use(
      http.get('/api/sessions/00000000-0000-0000-0000-000000000001', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    )
    const onNewSession = vi.fn()
    render(
      <ChatView
        {...sessionInfo}
        initialMessages={null}
        onNewSession={onNewSession}
      />,
    )
    await waitFor(() => expect(onNewSession).toHaveBeenCalled())
  })
})
