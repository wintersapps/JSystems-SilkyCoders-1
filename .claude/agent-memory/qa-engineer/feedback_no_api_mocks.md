---
name: E2E tests must NOT mock API endpoints
description: page.route() on /api/* is forbidden — tests must hit real backend, real DB, real LLM
type: feedback
---

Never use `page.route()` to intercept `/api/*` endpoints in E2E specs. AGENTS.md explicitly forbids this.

**Why:** Mocked tests gave false confidence — they passed while the real backend was broken. E2E tests must exercise the full stack: real Spring Boot backend at localhost:8080, real SQLite DB, real LLM via OpenRouter. If the backend isn't running, tests should fail loudly, not silently pass against mocks.

**How to apply:**
- Remove any `page.route('/api/...')` calls from specs
- For session resume tests, create a real session via form submit in `test.beforeAll`, then use the real sessionId
- For 404 tests, use a random UUID that doesn't exist in the DB — real backend returns 404 naturally, no mock needed
- Increase timeouts to accommodate real LLM streaming (30s+ for first AI response)
- Assert that an AI response *appeared* (non-empty text in chat), never assert the exact LLM output string
