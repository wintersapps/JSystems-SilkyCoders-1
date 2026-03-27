# Backend Testing Guidelines

## Rules
- **Never call real OpenAI** — always mock `OpenAIClient` with Mockito
- **Use H2 in-memory DB** for integration tests — not SQLite
  ```properties
  # src/test/resources/application-test.properties
  spring.datasource.url=jdbc:h2:mem:testdb
  spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
  ```
- Test class naming: `*Tests` suffix, mirrored package under `com.sinsay`

## Unit Test Targets

| Class | What to test |
|---|---|
| `PolicyDocService` | RETURN prompt includes regulamin + zwrot-30-dni, NOT reklamacje. COMPLAINT prompt includes regulamin + reklamacje, NOT zwrot-30-dni. |
| `AnalysisService` | User message has exactly 2 content parts (image + text). Session and ChatMessages persisted. Response maps to `{sessionId, message}`. |
| `ChatService` | Vercel stream encoder correctly escapes `"`, `\`, newlines. ASSISTANT message persisted after stream completes. |
| Stream encoder (util) | `"it's \"great\""` → `0:"it's \"great\""`. Newline in text → `\\n` in output. |

## Integration Test Targets (MockMvc + H2)

| Endpoint | Scenarios |
|---|---|
| `POST /api/sessions` | Valid multipart → 200 + sessionId. Missing intent → 400. Missing image → 400. Invalid MIME → 400. Image > 10 MB → 400. |
| `GET /api/sessions/{id}` | Existing session → 200. Unknown ID → 404. |
| `POST /api/sessions/{id}/messages` | Valid → 200 stream with correct format. Unknown sessionId → 404. |

## Technical Acceptance Criteria
- **TAC-BE-01**: RETURN system prompt does NOT contain the word "reklamacj"
- **TAC-BE-02**: COMPLAINT system prompt does NOT contain content from `zwrot-30-dni.md`
- **TAC-BE-03**: Initial analysis message has exactly 2 content parts (image + text)
- **TAC-BE-04**: Stream encoder escapes `"`, `\`, and `\n` correctly
- **TAC-BE-05**: Stream ends with `d:{"finishReason":"stop"}\n`
- **TAC-BE-06**: After streaming, exactly one new ASSISTANT ChatMessage in DB
- **TAC-BE-07**: Image 10 MB + 1 byte returns HTTP 400
- **TAC-BE-08**: `OpenAIClient` bean is configured from environment variables
