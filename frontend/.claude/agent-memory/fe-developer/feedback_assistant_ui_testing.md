---
name: assistant-ui jsdom test mocks
description: Required jsdom polyfills when testing components that use @assistant-ui/react
type: feedback
---

When testing components that use `@assistant-ui/react` primitives in jsdom (Vitest), add these to `src/test/setup.ts`:

```ts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Element.prototype.scrollTo = function () {}
```

**Why:** `@assistant-ui/react` uses `ResizeObserver` internally (via `useOnResizeContent`) and calls `div.scrollTo` via `useThreadViewportAutoScroll`. jsdom implements neither.

**How to apply:** Add both mocks to the test setup file whenever a test file imports from `@assistant-ui/react`. Without them, all ChatView tests fail with `ReferenceError: ResizeObserver is not defined` or `TypeError: div.scrollTo is not a function`.

---

`ThreadPrimitive.Messages` does NOT render messages in jsdom — the viewport div renders empty. Use `useThread` from `@assistant-ui/react` inside `AssistantRuntimeProvider` to read thread messages and render them manually instead.

**Why:** `ThreadPrimitive.Messages` depends on DOM APIs (MutationObserver, auto-scroll) that don't work fully in jsdom.

**How to apply:** Build a custom `ThreadMessages` component using `useThread((s) => s.messages)` and map over the result. This works in both jsdom and browser.
