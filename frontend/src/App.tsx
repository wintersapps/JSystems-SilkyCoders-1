import { useState } from 'react'
import { useSession } from './hooks/useSession'
import { IntakeForm } from './components/IntakeForm'
import { ChatView } from './components/ChatView'

interface ChatState {
  sessionId: string
  intent: 'RETURN' | 'COMPLAINT'
  orderNumber: string
  productName: string
  description: string
  initialMessage: string
}

interface UIMessagePart {
  type: 'text'
  text: string
}

interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  content: UIMessagePart[]
}

function App() {
  const { sessionId, setSessionId, clearSession } = useSession()
  const [chatState, setChatState] = useState<ChatState | null>(null)

  const showChat = sessionId !== null

  const handleFormSuccess = (
    newSessionId: string,
    message: string,
    description: string,
    intent: 'RETURN' | 'COMPLAINT',
    orderNumber: string,
    productName: string,
  ): void => {
    setSessionId(newSessionId)
    setChatState({
      sessionId: newSessionId,
      intent,
      orderNumber,
      productName,
      description,
      initialMessage: message,
    })
  }

  const handleNewSession = (): void => {
    clearSession()
    setChatState(null)
  }

  if (showChat) {
    const freshMessages: UIMessage[] | null = chatState
      ? [
          {
            id: 'init-0',
            role: 'user' as const,
            content: [{ type: 'text' as const, text: chatState.description }],
          },
          {
            id: 'init-1',
            role: 'assistant' as const,
            content: [
              { type: 'text' as const, text: chatState.initialMessage },
            ],
          },
        ]
      : null

    return (
      <ChatView
        sessionId={sessionId}
        intent={chatState?.intent ?? 'RETURN'}
        orderNumber={chatState?.orderNumber ?? ''}
        productName={chatState?.productName ?? ''}
        initialMessages={freshMessages}
        onNewSession={handleNewSession}
      />
    )
  }

  return <IntakeForm onSuccess={handleFormSuccess} />
}

export default App
