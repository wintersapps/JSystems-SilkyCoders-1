import { useEffect, useState } from 'react'
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  useThread,
} from '@assistant-ui/react'
import {
  useChatRuntime,
  AssistantChatTransport,
} from '@assistant-ui/react-ai-sdk'
import type { UIMessage as AiUIMessage, TextUIPart } from 'ai'
import type {
  ThreadUserMessage,
  ThreadAssistantMessage,
} from '@assistant-ui/react'

interface UIMessagePart {
  type: 'text'
  text: string
}

interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  content: UIMessagePart[]
}

interface ChatViewProps {
  sessionId: string
  intent: 'RETURN' | 'COMPLAINT'
  orderNumber: string
  productName: string
  initialMessages: UIMessage[] | null
  onNewSession: () => void
}

interface ApiSessionMessage {
  id: string
  role: string
  content: string
  sequenceNumber: number
}

function mapApiMessages(messages: ApiSessionMessage[]): UIMessage[] {
  return messages
    .slice()
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    .map((m) => ({
      id: m.id,
      role: m.role.toLowerCase() as 'user' | 'assistant',
      content: [{ type: 'text' as const, text: m.content }],
    }))
}

function toAiMessages(messages: UIMessage[]): AiUIMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    parts: m.content.map(
      (part): TextUIPart => ({ type: 'text' as const, text: part.text }),
    ),
    content: '',
  }))
}

type ThreadMsg = ThreadUserMessage | ThreadAssistantMessage

function extractText(msg: ThreadMsg): string {
  return msg.content
    .filter((part) => part.type === 'text')
    .map((part) => (part as { type: 'text'; text: string }).text)
    .join('')
}

function ThreadMessages() {
  const messages = useThread((s) => s.messages) as readonly ThreadMsg[]

  return (
    <div className="flex flex-col gap-4">
      {messages.map((msg) => {
        const text = extractText(msg)
        if (!text) return null
        return (
          <div
            key={msg.id}
            className={
              msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'
            }
          >
            <div
              className="px-4 py-3 max-w-[80%] text-sm"
              style={
                msg.role === 'user'
                  ? {
                      backgroundColor: '#E09243',
                      color: '#ffffff',
                      borderRadius: '16px 16px 2px 16px',
                    }
                  : {
                      backgroundColor: '#f1f2f4',
                      color: '#16181D',
                      borderRadius: '16px 16px 16px 2px',
                      border: '1px solid #e3e4e5',
                    }
              }
            >
              {text}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface ChatRuntimeViewProps {
  sessionId: string
  messages: UIMessage[]
}

function ChatRuntimeView({ sessionId, messages }: ChatRuntimeViewProps) {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: `/api/sessions/${sessionId}/messages`,
    }),
    messages: toAiMessages(messages),
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <ThreadMessages />
        </div>

        <div className="p-4" style={{ borderTop: '1px solid #e3e4e5' }}>
          <ComposerPrimitive.Root className="flex gap-2 items-end">
            <ComposerPrimitive.Input
              className="flex-1 resize-none px-3 py-2 text-sm focus:outline-none min-h-[40px] max-h-[120px]"
              style={{
                border: '1px solid #e3e4e5',
                borderRadius: '4px',
                color: '#333333',
              }}
              placeholder="Zadaj pytanie..."
              rows={1}
            />
            <ComposerPrimitive.Send
              className="text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: '#E09243',
                color: '#ffffff',
                border: '1.6px solid #E09243',
                borderRadius: '0px',
                padding: '10px 20px',
                cursor: 'pointer',
              }}
            >
              Wyślij
            </ComposerPrimitive.Send>
          </ComposerPrimitive.Root>
        </div>
      </div>
    </AssistantRuntimeProvider>
  )
}

export function ChatView({
  sessionId,
  intent,
  orderNumber,
  productName,
  initialMessages,
  onNewSession,
}: ChatViewProps) {
  const [messages, setMessages] = useState<UIMessage[] | null>(initialMessages)

  useEffect(() => {
    if (initialMessages !== null) return

    fetch(`/api/sessions/${sessionId}`)
      .then((res) => {
        if (!res.ok) {
          onNewSession()
          return null
        }
        return res.json() as Promise<{ messages: ApiSessionMessage[] }>
      })
      .then((data) => {
        if (!data) return
        setMessages(mapApiMessages(data.messages))
      })
      .catch(() => onNewSession())
  }, [sessionId, initialMessages, onNewSession])

  const intentLabel = intent === 'RETURN' ? 'Zwrot' : 'Reklamacja'

  return (
    <div className="flex flex-col h-full">
      {/* Summary bar — dark brand background */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
        style={{ backgroundColor: '#16181D' }}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm min-w-0">
          <span className="font-semibold shrink-0" style={{ color: '#ffffff' }}>
            [{intentLabel}]
          </span>
          <span className="shrink-0" style={{ color: '#afb0b2' }}>
            {orderNumber}
          </span>
          <span style={{ color: '#afb0b2' }}>-</span>
          <span className="truncate" style={{ color: '#afb0b2' }}>
            {productName}
          </span>
        </div>
        <button
          type="button"
          onClick={onNewSession}
          className="shrink-0 text-sm font-semibold transition-colors"
          style={{
            color: '#ffffff',
            border: '1.6px solid #ffffff',
            borderRadius: '0px',
            padding: '6px 16px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
          }}
        >
          Nowa sesja
        </button>
      </div>

      {messages !== null ? (
        <ChatRuntimeView
          key={sessionId}
          sessionId={sessionId}
          messages={messages}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Ładowanie historii...
        </div>
      )}
    </div>
  )
}
