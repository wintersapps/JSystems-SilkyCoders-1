# Frontend Guidelines

## Stack
React 19 + TypeScript (strict) + Vite. UI: Shadcn/ui + Tailwind CSS. Chat: `@assistant-ui/react-ai-sdk`. All UI text in **Polish**.

## Component Map
```
frontend/src/
├── App.tsx              Root — reads localStorage, toggles form ↔ chat (no router)
├── components/
│   ├── IntakeForm.tsx   5-field form, submits to POST /api/sessions
│   ├── ChatView.tsx     Renders chat, "Nowa sesja" button, loads session history
│   └── ImageUpload.tsx  Drag-and-drop + preview, inline validation
└── hooks/
    └── useSession.ts    localStorage read/write/clear for sinsay_session_id
```

## Form Fields & Validation
| Field | Type | Rules |
|---|---|---|
| intent | radio | Required: `"RETURN"` or `"COMPLAINT"` |
| orderNumber | text | Required, max 100 chars |
| productName | text | Required, max 255 chars |
| description | textarea | Required, max 5000 chars |
| image | file | Required, JPEG/PNG/WebP/GIF only, max 10 MB |

Validate on submit (not on keystroke). Show inline errors without scrolling. Image MIME + size checked client-side before submit.

## Form → Chat Transition
```
submit → POST /api/sessions → { sessionId, message }
  → localStorage.setItem('sinsay_session_id', sessionId)
  → App switches to ChatView with initialMessages
```
`App.tsx` state: `{ view: 'form' | 'chat', sessionId: string | null }`. No routing library.

## Chat Runtime
```typescript
useChatRuntime({
  api: `/api/sessions/${sessionId}/messages`,
  initialMessages: [...],  // Vercel AI SDK Message format
})
```
Use `useChatRuntime` from `@assistant-ui/react-ai-sdk` — it handles the Vercel data stream format natively.

## Session Resume
```
App.tsx mounts
  → read localStorage 'sinsay_session_id'
  → if found: render ChatView (skip form)
  → ChatView mounts: GET /api/sessions/{id}
  → map messages → useChatRuntime initialMessages
```
"Nowa sesja" button: clear localStorage → switch to IntakeForm.

## Dev Setup
- `npm run dev` — Vite dev server on `:5173`, proxies `/api/*` to `http://localhost:8080`
- `npm run build` — outputs to `../backend/src/main/resources/static/`
- `npm run lint` — ESLint
- `npm run test` — Vitest

## TypeScript Rules
- Strict mode enabled
- Prefer `interface` over `type`
- No `any`; use type guards for runtime safety
- No `as` assertions unless unavoidable
- PascalCase component names and file names
