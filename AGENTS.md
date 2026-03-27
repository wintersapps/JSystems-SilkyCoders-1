# Repository Guidelines

## Project Overview
**Sinsay AI PoC** — a form-to-chat web app where users submit product return/complaint requests with an image, an LLM analyzes it against policy documents, and the user continues via chat. All UI and AI responses are in **Polish**.

## Repository Structure
```
backend/    Spring Boot app (Maven, Java 21)
frontend/   React 19 SPA (Vite, TypeScript)
docs/       PRD, ADR specs, and policy documents
```
ADRs in `docs/ADR/` are the **authoritative specification**. Read them before making changes.

## Architecture
Single Spring Boot JAR serving the React SPA. In dev, Vite runs on `:5173` and proxies `/api/*` to Spring Boot on `:8080`.

### API Contracts
| Method | Path | Notes |
|---|---|---|
| POST | `/api/sessions` | Multipart: intent, orderNumber, productName, description, image. Returns `{sessionId, message}` (NOT streamed) |
| GET | `/api/sessions/{id}` | Returns `{session, messages}` |
| POST | `/api/sessions/{id}/messages` | JSON `{content}`. Streams Vercel data stream format |

### Streaming Format (Vercel data stream)
```
0:"Hello"\n
0:" world"\n
d:{"finishReason":"stop"}\n
```
Escape rules: `"` → `\"`, `\` → `\\`, newline → `\\n`

### Key Decisions
- **LLM**: OpenAI Java SDK (`com.openai:openai-java`) → OpenRouter. **Not Spring AI.**
- **Streaming**: Spring WebMVC `ResponseBodyEmitter` (not WebFlux)
- **Persistence**: SQLite via `org.hibernate.community.dialect.SQLiteDialect`
- **Session resume**: `sinsay_session_id` in `localStorage`
- **Policy docs** (`POLICY_DOCS_PATH`, default `../docs`):
  - `regulamin.md` — always included
  - `zwrot-30-dni.md` — RETURN intent only
  - `reklamacje.md` — COMPLAINT intent only

## Coding Conventions
- Java: 4-space indent, `com.sinsay` package, `*Tests` test suffix
- TypeScript: strict mode, interfaces over types, no `any`, PascalCase components
- Commits: `Area: short summary` (e.g. `Feature:`, `Fix:`, `Docs:`)
