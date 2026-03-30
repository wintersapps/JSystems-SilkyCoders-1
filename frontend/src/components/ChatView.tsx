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
              className={
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%] text-sm'
                  : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-sm px-4 py-2 max-w-[80%] text-sm'
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

        <div className="border-t border-gray-200 p-4">
          <ComposerPrimitive.Root className="flex gap-2 items-end">
            <ComposerPrimitive.Input
              className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] max-h-[120px]"
              placeholder="Napisz wiadomość..."
              rows={1}
            />
            <ComposerPrimitive.Send className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-gray-900">{intentLabel}</span>
          <span className="text-gray-600">{productName}</span>
          <span className="text-gray-500">{orderNumber}</span>
        </div>
        <button
          type="button"
          onClick={onNewSession}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
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
