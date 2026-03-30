---
name: Playwright + Node 18.12 ESM compatibility
description: Playwright 1.50+ requires Node ≥18.19 for ESM config/test loading; use 1.49.x with CJS config on Node 18.12
type: feedback
---

Use @playwright/test@1.49.1 when the environment runs Node 18.12 (this project's CI Node version).

**Why:** Playwright 1.50+ requires Node ≥18.19 to load ESM modules. This project has `"type": "module"` in package.json, so both the config and test files are treated as ESM. Node 18.12 cannot handle this — the runner crashes with "Playwright requires Node.js 18.19 or higher to load esm modules."

**How to apply:**
- Pin `@playwright/test@1.49.1` in package.json (not latest).
- Use `playwright.config.cjs` (CommonJS format, `require()` syntax) — the `.cjs` extension bypasses the `type:module` rule.
- Write test files as `.spec.js` (ES module syntax with `import`) — Playwright 1.49 can transpile these without Node 18.19.
- Do NOT write test files as `.spec.ts` — TypeScript extension causes "Unknown file extension .ts" error with this Node/ESM combination.
- Add `exclude: ['**/tests/e2e/**']` to Vitest config so Vitest does not try to collect Playwright spec files.
