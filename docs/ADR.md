# Architecture Decision Records — Sinsay AI Chatbot

---

## ADR-001: OpenAI Java SDK vs Spring AI

**Status:** Accepted
**Date:** 2026-03-26

**Context:**
The application requires a single integration point with a multimodal LLM. Two main options exist for a Java backend: the OpenAI Java SDK (direct, thin client) and Spring AI (an abstraction layer over multiple LLM providers built into the Spring ecosystem). The MVP has one well-defined LLM call pattern: submit form data + image + policy documents, receive a structured decision.

**Decision:**
Use the **OpenAI Java SDK** directly. For an MVP with a fixed, single-provider setup and no requirement to swap LLM providers, Spring AI's abstraction adds complexity without benefit. The OpenAI SDK is stable, well-documented, supports multimodal requests natively, and keeps the dependency footprint minimal. Spring AI remains a valid migration path if multi-provider support becomes a requirement post-MVP.

**Consequences:**
- (+) Simpler setup — no Spring AI auto-configuration, fewer abstraction layers to debug.
- (+) Full control over request construction (system prompt, document injection, image payload).
- (+) Smaller dependency surface for an MVP codebase.
- (-) Provider lock-in to OpenAI. Switching to Anthropic or another provider requires rewriting the integration layer.
- (-) No built-in chat memory abstraction — conversation history must be managed manually as a message list.

---

## ADR-002: Two Separate LLM Calls (Vision + Decision) vs One Multimodal Call

**Status:** Accepted
**Date:** 2026-03-26

**Context:**
The core flow requires the application to (1) assess whether the uploaded photo is clear enough to evaluate, and (2) make a policy-grounded return/complaint decision based on the image and description. This could be implemented as two sequential LLM calls — a vision-only quality check followed by a full decision call — or as a single multimodal call that handles both in one prompt.

**Decision:**
Use a **single multimodal call**. The system prompt instructs the model to first evaluate image quality and, if insufficient, respond with a re-upload request instead of a decision. This eliminates one full API round-trip, reduces latency and cost, and keeps the application logic simple. The two-call approach would only be justified if image quality assessment required a separate specialized model, which is not the case here.

**Consequences:**
- (+) Half the API cost and latency per submission compared to the two-call approach.
- (+) Single code path — no conditional branching between call 1 and call 2.
- (+) Policy documents are attached once, not duplicated across two calls.
- (-) The single prompt must carry more responsibility — quality check logic and decision logic coexist. Prompt engineering requires care.
- (-) If image analysis and reasoning ever need different models (e.g., a specialized vision model), the architecture will need to be split at that point.

---

## ADR-003: SQLite vs Redis vs PostgreSQL for Session Storage in MVP

**Status:** Accepted
**Date:** 2026-03-26

**Context:**
The multi-turn chat requires conversation history to be maintained between HTTP requests (each follow-up message must include prior turns so the LLM has context). Per the PRD, there is no requirement to persist sessions beyond the browser session — no data is saved after the user closes the window. Three options were considered: SQLite (file-based, embedded), Redis (in-memory store, requires a separate process), and PostgreSQL (full relational DB, requires a server).

**Decision:**
Store conversation history **in-memory on the server** (e.g., a `ConcurrentHashMap` keyed by session ID), with no external storage dependency. For a single-instance MVP with no persistence requirement, this is sufficient. SQLite would be the next step if lightweight persistence were needed. Redis and PostgreSQL are out of scope for MVP — both require infrastructure that adds deployment complexity with no functional benefit at this stage.

**Consequences:**
- (+) Zero infrastructure overhead — no additional process or service to run.
- (+) No schema design, no migrations, no connection pooling to manage.
- (+) Sessions are automatically cleaned up when the process restarts or the user closes the tab.
- (-) Sessions are lost on server restart. Acceptable for MVP; unacceptable in production.
- (-) Does not scale horizontally — two server instances cannot share in-memory state. Not a concern for single-instance MVP deployment.
- (-) No visibility into active sessions for debugging. A future migration to SQLite or Redis would address this.
