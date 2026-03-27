# CLAUDE.md

@AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

This is a **course repository** for JSystems AI training at Silky Coders. The goal is to build the **Sinsay AI PoC** — a Spring Boot + React app where users submit product return/complaint requests with an image, an LLM analyzes it, and the user continues via chat.

The `master` branch is a bare Spring Boot starter. Course participants build the application on top of it. The ADRs in `docs/ADR/` are the authoritative specification.

## Commands

### Backend (Maven, Java 21)
```sh
./mvnw spring-boot:run          # Run the app
./mvnw test                     # Run all tests
./mvnw test -Dtest=ClassName    # Run a single test class
./mvnw package -DskipTests      # Build JAR
./mvnw verify                   # Run tests + integration checks
```

### Frontend (Vite + React, lives in `frontend/`)
```sh
npm install          # Install dependencies
npm run dev          # Dev server on :5173, proxies /api/* to :8080
npm run build        # Build into ../backend/src/main/resources/static/
npm run test         # Vitest
npm run lint         # ESLint
```

### Full production build
```sh
cd frontend && npm run build    # Build frontend first
./mvnw package                  # Then package the fat JAR
```

## Architecture

Monolith: single Spring Boot JAR serving the React SPA (Vite output goes to `backend/src/main/resources/static/`). In dev, Vite runs on :5173 and proxies `/api/*` to Spring Boot on :8080.

### Key design decisions (from ADRs)
- **LLM**: OpenAI Java SDK (`com.openai:openai-java`) calling OpenRouter (not Spring AI). Configured via `OpenAIOkHttpClient.fromEnv()` — picks up `OPENAI_API_KEY` and `OPENAI_BASE_URL` automatically.
- **Streaming**: Spring WebMVC with `ResponseBodyEmitter` (not WebFlux). The chat endpoint emits **Vercel data stream format** (`0:"chunk"\n` lines, ending with `d:{"finishReason":"stop"}\n`) required by `useChatRuntime` on the frontend.
- **Initial analysis**: NOT streamed — returns full JSON `{sessionId, message}`. Only chat continuation is streamed.
- **Persistence**: SQLite via `org.hibernate.community.dialect.SQLiteDialect` (hibernate-community-dialects). DB file: `backend/sinsay_poc.db`.
- **Frontend chat**: `useChatRuntime` from `@assistant-ui/react-ai-sdk` wrapping Vercel AI SDK's `useChat`. No routing library — form↔chat is a single state toggle in `App.tsx`.
- **Session resume**: `sessionId` stored in `localStorage` under key `sinsay_session_id`.

### Package structure (target)
```
src/main/java/com/sinsay/
├── config/       # AppConfig, OpenAIConfig, WebConfig (CORS for dev)
├── controller/   # SessionController, ChatController
├── service/      # AnalysisService, ChatService, PolicyDocService
├── repository/   # SessionRepository, ChatMessageRepository (JPA)
└── model/        # Session, ChatMessage (JPA entities, Lombok)
```

### Policy documents
`PolicyDocService` reads `.md` files from `POLICY_DOCS_PATH` (default: `../docs` relative to `backend/`):
- `regulamin.md` — always included in system prompt
- `zwrot-30-dni.md` — RETURN intent only
- `reklamacje.md` — COMPLAINT intent only

### Environment variables
| Variable | Required | Notes |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenRouter key (`sk-or-v1-...`) |
| `OPENAI_BASE_URL` | Yes | `https://openrouter.ai/api/v1` |
| `OPENAI_MODEL` | No | Default: `openai/gpt-4o-mini` |
| `POLICY_DOCS_PATH` | No | Default: `../docs` |

Set these in a `.env` file (gitignored) or export before running.

## Testing

Backend: JUnit 5 + Mockito. Mock `OpenAIClient` — never call real OpenAI in tests. Use H2 in-memory DB for integration tests (not SQLite).

Frontend: Vitest + React Testing Library + MSW for HTTP mocking.

See `docs/ADR/000-main-architecture.md` §10 for the full Technical Acceptance Criteria (TAC-01 through TAC-15).

## Context7 library IDs (for documentation lookups)
| Library | ID |
|---|---|
| OpenAI Java SDK | `/openai/openai-java` |
| Spring Boot | `/spring-projects/spring-boot` |
| assistant-ui | `/assistant-ui/assistant-ui` |
| Vercel AI SDK | `/vercel/ai` |
| Shadcn/ui | `/shadcn-ui/ui` |
| Tailwind CSS | `/tailwindlabs/tailwindcss.com` |
