# Frontend Testing Guidelines

## Stack
Vitest + React Testing Library + MSW (Mock Service Worker) for HTTP mocking.

## Rules
- Write tests alongside new components/hooks, not after
- Use MSW to mock all `/api/*` calls — never hit real backend
- `npm run test`, `npm run lint` are the primary validation loop

## MSW Handlers to Set Up
```typescript
// POST /api/sessions → { sessionId: 'test-uuid', message: 'AI response' }
// GET /api/sessions/:id → { session: {...}, messages: [...] }
// POST /api/sessions/:id/messages → streaming Vercel data stream
```

## Key Test Scenarios

### IntakeForm
| Scenario | Expected |
|---|---|
| Submit with all fields empty | 5 inline validation errors |
| Upload a PDF file | Error "Dozwolone formaty: JPEG, PNG, WebP, GIF" without form submit |
| Upload a file > 10 MB | Error containing "10 MB" without form submit |
| Valid submit | `localStorage` contains non-empty `sinsay_session_id` |
| Valid submit | Submit button shows "Analizuję..." and is disabled during request |

### ChatView
| Scenario | Expected |
|---|---|
| `localStorage` has sessionId | Chat renders (no form), `GET /api/sessions/{id}` called |
| Click "Nowa sesja" | `localStorage` cleared, IntakeForm rendered |
| Send a chat message | `POST /api/sessions/{id}/messages` called |
| Streaming response | Text appears token by token |

### App (session resume)
- Page load with `localStorage` sessionId → ChatView renders, not IntakeForm
- Page load without localStorage entry → IntakeForm renders

## Technical Acceptance Criteria
- **TAC-FE-01**: All empty submit → 5 validation errors
- **TAC-FE-02**: PDF upload → "Dozwolone formaty" error (no submit)
- **TAC-FE-03**: File > 10 MB → "10 MB" error (no submit)
- **TAC-FE-04**: Valid submit → `localStorage` contains non-empty sessionId
- **TAC-FE-05**: Page load with localStorage sessionId → chat rendered
- **TAC-FE-06**: "Nowa sesja" click → localStorage cleared, form rendered
- **TAC-FE-07**: Chat input submit → `POST /api/sessions/{id}/messages` called
- **TAC-FE-08**: All UI text in Polish
- **TAC-FE-09**: No horizontal scroll on 375 px viewport
