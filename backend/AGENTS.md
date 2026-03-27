# Backend Guidelines

## Package Structure
```
src/main/java/com/sinsay/
├── config/       AppConfig, OpenAIConfig, WebConfig
├── controller/   SessionController, ChatController
├── service/      AnalysisService, ChatService, PolicyDocService
├── repository/   SessionRepository, ChatMessageRepository (JPA)
└── model/        Session, ChatMessage (JPA entities + Lombok)
```
> Current starter uses `com.silkycoders1.jsystemssilkycodders1`. Migrate to `com.sinsay` when implementing the PoC.

## Component Responsibilities

### Controllers
- `SessionController`: `POST /api/sessions` (multipart validation → AnalysisService → JSON), `GET /api/sessions/{id}` (load + 404)
- `ChatController`: `POST /api/sessions/{id}/messages` (load session/history → ChatService → `ResponseBodyEmitter`)

### Services
- `AnalysisService`: receives validated form + image → base64-encodes image → calls PolicyDocService → builds prompt → calls OpenAI (synchronous) → persists Session + first ChatMessages → returns `{sessionId, message}`
- `ChatService`: receives session + history + new message → persists USER message → calls `openAIClient.chat().completions().createStreaming()` → writes Vercel chunks to `ResponseBodyEmitter` → writes finish line → calls `emitter.complete()` → persists ASSISTANT message
- `PolicyDocService`: reads `.md` files from `POLICY_DOCS_PATH` (env var, default `../docs`). `getSystemPrompt(RETURN)` includes regulamin + zwrot-30-dni; `getSystemPrompt(COMPLAINT)` includes regulamin + reklamacje.

### Config
- `OpenAIConfig`: creates `OpenAIClient` bean via `OpenAIOkHttpClient.builder()`. Reads `OPENAI_API_KEY`, `OPENAI_BASE_URL` from environment; `OPENAI_MODEL` from Spring properties.
- `WebConfig`: CORS allow `http://localhost:5173` **in `dev` profile only**.

## Data Models

### Session
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| intent | Enum: RETURN / COMPLAINT | Determines policy docs |
| orderNumber | String (max 100) | |
| productName | String (max 255) | |
| description | TEXT | |
| createdAt | LocalDateTime | |

### ChatMessage
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| sessionId | UUID | FK → Session |
| role | Enum: USER / ASSISTANT | |
| content | TEXT | |
| sequenceNumber | Integer | 0-based ordering |
| createdAt | LocalDateTime | |

## Multipart Validation (POST /api/sessions)
- `intent`: required, `"RETURN"` or `"COMPLAINT"`
- `orderNumber`: required, max 100 chars
- `productName`: required, max 255 chars
- `description`: required, max 5000 chars
- `image`: required, max 10 MB, MIME must be `image/jpeg`, `image/png`, `image/webp`, or `image/gif`

Return 400 for any validation failure.

## Image Handling
Base64-encode `MultipartFile` bytes → construct data URI: `data:<mimeType>;base64,<encoded>`. No file storage. Pass as image content part in the OpenAI message alongside the text description.

## Vercel Data Stream Encoding
```
Content-Type: text/plain;charset=UTF-8
X-Vercel-AI-Data-Stream: v1

0:"Hello"\n
0:" world"\n
d:{"finishReason":"stop"}\n
```
Escaping: `"` → `\"`, `\` → `\\`, newline → `\\n`. Lines end with `\n` (not `\r\n`).

## SQLite Setup
- Dialect: `org.hibernate.community.dialect.SQLiteDialect` (from `hibernate-community-dialects`)
- DB file: `sinsay_poc.db` (next to the JAR, in `backend/` during dev)
- `spring.jpa.hibernate.ddl-auto=update` in dev

## Required Maven Dependencies (to add to pom.xml)
```xml
<!-- OpenAI Java SDK -->
<dependency>
  <groupId>com.openai</groupId>
  <artifactId>openai-java</artifactId>
  <version><!-- check latest --></version>
</dependency>
<!-- Spring Data JPA -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<!-- SQLite driver -->
<dependency>
  <groupId>org.xerial</groupId>
  <artifactId>sqlite-jdbc</artifactId>
</dependency>
<!-- SQLite Hibernate dialect -->
<dependency>
  <groupId>org.hibernate.community</groupId>
  <artifactId>hibernate-community-dialects</artifactId>
</dependency>
<!-- H2 for tests -->
<dependency>
  <groupId>com.h2database</groupId>
  <artifactId>h2</artifactId>
  <scope>test</scope>
</dependency>
```
