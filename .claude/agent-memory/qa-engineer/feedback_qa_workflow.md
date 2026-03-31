---
name: QA workflow — manual Playwright MCP test before writing specs
description: QA must manually verify app with Playwright MCP first (Phase 1), then codify in specs (Phase 2)
type: feedback
---

Always run Phase 1 manual smoke test with Playwright MCP BEFORE writing any automated spec.

**Why:** Tests should codify working behavior. Writing specs against a broken app embeds bugs as expected behavior. Manual testing first catches bugs that should be fixed (by fe-developer/be-developer), not tested around.

**How to apply:**

Phase 1 — Manual smoke test via Playwright MCP:
1. Verify backend is running: `cd backend && ./mvnw spring-boot:run`
2. Verify frontend is running: `cd frontend && npm run dev`
3. Use Playwright MCP to open `http://localhost:5173`
4. Fill the form: select intent (RETURN or COMPLAINT), enter order number, product name, description
5. Upload a real image from `assets/example-images/` — test `cloth1.webp` (WebP) AND one JPEG
6. Click submit — wait for chat view
7. Verify AI response streams in (non-empty Polish text)
8. Send a follow-up message — verify response streams
9. Click "Nowa sesja" — verify form appears and localStorage is cleared
10. Take screenshots at EVERY step and save to `tests/e2e/screenshots/`
11. Analyze each screenshot: does the UI look correct? Are there layout issues? Is text in Polish?

If ANY step fails → document the bug and stop. Do NOT write tests yet. Report to fe-developer/be-developer.

Phase 2 — Write Playwright specs only after Phase 1 passes clean.

**Screenshots:**
- Save to `tests/e2e/screenshots/<descriptive-name>.png`
- Analyze each screenshot visually — does UI match wireframes at `docs/wireframe-form.png` and `docs/wireframe-decision+chat.png`?
- Report any visual discrepancies to fe-developer

**Logging:**
- Log every step to `logs/e2e-tests.log` at repo root
- Format: `[timestamp] [test] [step] message`
- Create `logs/` directory if missing with `fs.mkdirSync`
