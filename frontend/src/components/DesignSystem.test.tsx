import { render, screen } from '@testing-library/react'
import { IntakeForm } from './IntakeForm'
import { ChatView } from './ChatView'

describe('Design system — Polish text (TAC-FE-08)', () => {
  it('IntakeForm has Polish submit button text', () => {
    render(<IntakeForm onSuccess={() => {}} />)
    expect(screen.getByRole('button', { name: /sprawdź/i })).toBeInTheDocument()
  })

  it('IntakeForm has Polish field labels', () => {
    render(<IntakeForm onSuccess={() => {}} />)
    expect(screen.getByText(/numer zamówienia/i)).toBeInTheDocument()
    expect(screen.getByText(/nazwa produktu/i)).toBeInTheDocument()
    expect(screen.getByText(/opis/i)).toBeInTheDocument()
  })

  it('IntakeForm renders logo image', () => {
    render(<IntakeForm onSuccess={() => {}} />)
    const logo = screen.getByRole('img', { name: /sinsay/i })
    expect(logo).toBeInTheDocument()
  })

  it('ChatView shows Polish "Nowa sesja" button', () => {
    render(
      <ChatView
        sessionId="test-id"
        intent="RETURN"
        orderNumber="ORD-001"
        productName="Jacket"
        initialMessages={[]}
        onNewSession={() => {}}
      />,
    )
    expect(
      screen.getByRole('button', { name: /nowa sesja/i }),
    ).toBeInTheDocument()
  })

  it('ChatView shows intent in Polish', () => {
    render(
      <ChatView
        sessionId="test-id"
        intent="RETURN"
        orderNumber="ORD-001"
        productName="Jacket"
        initialMessages={[]}
        onNewSession={() => {}}
      />,
    )
    expect(screen.getByText(/zwrot/i)).toBeInTheDocument()
  })
})
