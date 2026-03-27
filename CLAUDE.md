# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

### Backend (run from `backend/`)
```sh
./mvnw spring-boot:run                # Run the app
./mvnw test                           # Run all tests
./mvnw test -Dtest=ClassName          # Run a single test class
./mvnw package -DskipTests            # Build JAR
./mvnw verify                         # Tests + integration checks
```

### Frontend (run from `frontend/`)
```sh
npm install          # Install dependencies
npm run dev          # Dev server on :5173, proxies /api/* to :8080
npm run build        # Build into ../backend/src/main/resources/static/
npm run test         # Vitest
npm run lint         # ESLint
```

### Full production build
```sh
cd frontend && npm run build          # Build frontend first
cd backend && ./mvnw package          # Package the fat JAR
```

## Environment Variables
| Variable | Required | Notes |
|---|---|---|
| `OPENAI_API_KEY` | Yes | OpenRouter key (`sk-or-v1-...`) |
| `OPENAI_BASE_URL` | Yes | `https://openrouter.ai/api/v1` |
| `OPENAI_MODEL` | No | Default: `openai/gpt-4o-mini` |
| `POLICY_DOCS_PATH` | No | Default: `../docs` (relative to `backend/`) |

Set in a `.env` file (gitignored) or export before running.

## Context7 Library IDs
| Library | ID |
|---|---|
| OpenAI Java SDK | `/openai/openai-java` |
| Spring Boot | `/spring-projects/spring-boot` |
| Lombok | `/projectlombok/lombok` |
| assistant-ui | `/assistant-ui/assistant-ui` |
| Vercel AI SDK | `/vercel/ai` |
| Shadcn/ui | `/shadcn-ui/ui` |
| Tailwind CSS | `/tailwindlabs/tailwindcss.com` |
