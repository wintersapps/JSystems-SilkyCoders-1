# E2E Test Guidelines

## Framework

**Playwright** — add to `package.json` when implementing E2E tests.

Run against the full stack (backend at `localhost:8080`, frontend served by Vite or the bundled JAR).

## Key Scenarios

- Full **form → chat** flow: fill all fields + upload image → submit → chat view renders with initial AI message
- **Session resume**: reload page with valid `sinsay_session_id` in localStorage → ChatView renders with history
- **Streaming display**: assistant message appears incrementally (no spinner, text streams in)
- **"Nowa sesja" button**: clears session, returns to empty form
- **Form validation**: all 5 required field errors shown on empty submit

## Notes

- Seed test data via direct DB inserts or a test-only API endpoint — do not depend on real OpenAI responses
- Use Playwright's `page.route()` to mock `/api/*` when testing FE in isolation