# Repository Guidelines

## Project

**Sinsay AI PoC** — multimodal AI assistant for e-commerce returns (*Zwrot*) and complaints (*Reklamacja*). Users submit
a form with photo; backend analyzes against Sinsay policy docs using an LLM; result is streamed as a chat conversation.
All user-facing text in **Polish**.

**Key docs** (read before making changes):

- `docs/PRD-Product-Requirements-Document.md` — product requirements and acceptance criteria
- `docs/ADR/000-main-architecture.md` — architecture overview and data models
- `docs/ADR/001-backend.md` — backend implementation details
- `docs/ADR/002-frontend.md` — frontend implementation details

**Sinsay policy docs** (AI knowledge base): `docs/regulamin.md`, `docs/reklamacje.md`, `docs/zwrot-30-dni.md`

---

## Repository Layout

```
backend/          Spring Boot app (Java 21, Maven)
frontend/         React 19 SPA (TypeScript, Vite)
docs/ADR/         Architecture Decision Records
docs/             PRD + Sinsay policy markdown files
```

---

## Commands

```bash
# Backend
cd backend && ./mvnw spring-boot:run     # run (requires OPENAI_API_KEY env var)
cd backend && ./mvnw test                # run JUnit tests
cd backend && ./mvnw clean package       # build JAR (output: backend/target/)

# Frontend
cd frontend && npm run dev               # dev server (proxies /api/* to :8080)
cd frontend && npm run build             # build into backend/src/main/resources/static/
cd frontend && npm test                  # Vitest
cd frontend && npm run lint              # ESLint
cd frontend && npm run format:check      # Prettier
```

---

## Critical Integration: Vercel Data Stream Protocol

The frontend uses `useChatRuntime` from `@assistant-ui/react-ai-sdk`. The backend SSE response **must** use Vercel AI
SDK data stream format or streaming will break:

```
Content-Type: text/plain;charset=UTF-8

0:"Hello"\n
0:" world"\n
d:{"finishReason":"stop"}\n
```

Escape rules: `"` → `\"`, newline → `\\n`. Use `ResponseBodyEmitter`, not `Flux`.

---

## Coding Conventions

**Java:** 4-space indent, Spring Boot conventions. Package: `com.sinsay`. Tests: `*Tests` suffix.

**TypeScript:** Strict mode. Always annotate types. Prefer `interface` over `type`. No `any`, no `as`/`!` assertions.
Use type guards for runtime narrowing. Functional components with TypeScript interfaces.

---

## Agent Workflow

### Before Starting Any Task

1. Read the relevant PRD (`docs/PRD-Product-Requirements-Document.md`) and ADR files (`docs/ADR/`) for the affected
   area.
2. Read `backend/AGENTS.md` if the task touches `backend/`, or `frontend/AGENTS.md` if it touches `frontend/`.
3. Define the expected behavior from the specification before writing or changing any code.

Follow TDD, verification, and commit rules from CLAUDE.md.

---

## Context7 MCP Library IDs

| Library         | Context7 ID                     |
|-----------------|---------------------------------|
| OpenAI Java SDK | `/openai/openai-java`           |
| Spring Boot     | `/spring-projects/spring-boot`  |
| Lombok          | `/projectlombok/lombok`         |
| Vercel AI SDK   | `/vercel/ai`                    |
| assistant-ui    | `/assistant-ui/assistant-ui`    |
| React           | `/reactjs/react.dev`            |
| Tailwind CSS    | `/tailwindlabs/tailwindcss.com` |
| Shadcn/ui       | `/shadcn-ui/ui`                 |