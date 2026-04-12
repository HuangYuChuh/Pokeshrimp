# API Route Reference

All routes are served by the Next.js App Router under `src/app/api/`. No authentication is required — the app runs locally and trusts all requests from `localhost`.

---

## POST /api/chat

Start or continue a conversation with the agent. Returns an AI SDK data stream.

**Request body** (validated by `ChatRequestSchema` in `src/app/api/chat/route.ts`):

```json
{
  "messages": [
    { "role": "user", "content": "list files in this folder" }
  ],
  "modelId": "claude-sonnet",
  "sessionId": "optional-existing-session-id"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `messages` | `Array<{ role: string, content: unknown }>` | yes | Full conversation history |
| `modelId` | `string` | no | Model ID from `MODEL_OPTIONS` (default: `claude-sonnet`) |
| `sessionId` | `string` | no | Omit to auto-create a new session |

**Response**: Streaming — `Content-Type: text/event-stream` (Vercel AI SDK data stream protocol). The `X-Session-Id` header contains the session ID.

**Errors**:
- `400` — invalid body or unknown model
- `401` — API key not configured for the requested provider
- `500` — model construction failure

```bash
curl -N -X POST http://localhost:3099/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hello"}]}'
```

---

## POST /api/approval

Resolve a pending command approval request. Called by the frontend when the user clicks Allow Once / Always Allow / Deny.

**Request body**:

```json
{
  "id": "abc123",
  "decision": "allow-once"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `id` | `string` | yes | The approval request ID (from the data stream event) |
| `decision` | `string` | yes | `"allow-once"`, `"always-allow"`, or `"deny"` |

**Response**:

```json
{ "ok": true, "id": "abc123", "decision": "allow-once" }
```

**Errors**:
- `400` — missing/invalid `id` or `decision`
- `410` — approval request not found or already expired (60s timeout)

```bash
curl -X POST http://localhost:3099/api/approval \
  -H "Content-Type: application/json" \
  -d '{"id":"abc123","decision":"allow-once"}'
```

---

## GET /api/sessions

List all saved sessions, ordered by most recent activity.

**Response**:

```json
[
  {
    "id": "session-uuid",
    "title": "list files in this folder",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:01:00.000Z"
  }
]
```

```bash
curl http://localhost:3099/api/sessions
```

---

## POST /api/sessions

Create a new session.

**Request body** (validated by `CreateSessionSchema`):

```json
{
  "title": "My workflow"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | `string` | no | Max 200 chars, defaults to `"New Chat"` |

**Response** (`201`):

```json
{
  "id": "session-uuid",
  "title": "My workflow",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

```bash
curl -X POST http://localhost:3099/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"title":"My workflow"}'
```

---

## GET /api/sessions/:id

Fetch a single session with its full message history.

**Response**:

```json
{
  "id": "session-uuid",
  "title": "list files in this folder",
  "createdAt": "...",
  "updatedAt": "...",
  "messages": [
    { "role": "user", "content": "list files in this folder" },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Errors**:
- `404` — session not found

```bash
curl http://localhost:3099/api/sessions/SESSION_ID
```

---

## DELETE /api/sessions/:id

Delete a session and its messages.

**Response**:

```json
{ "ok": true }
```

```bash
curl -X DELETE http://localhost:3099/api/sessions/SESSION_ID
```

---

## GET /api/settings

Read the merged configuration. API keys are masked (only last 4 chars visible). Also reports which provider keys are set via environment variables.

**Response**:

```json
{
  "defaultModel": "claude-sonnet",
  "apiKeys": {
    "anthropic": "****abcd",
    "openai": ""
  },
  "envKeys": {
    "anthropic": true,
    "openai": false
  },
  "permissions": { "alwaysAllow": [], "alwaysDeny": [], "alwaysAsk": [] },
  "mcpServers": {},
  "hooks": {}
}
```

```bash
curl http://localhost:3099/api/settings
```

---

## PUT /api/settings

Update the global config file (`~/.visagent/config.json`). Only the fields you send are merged — omitted fields are left unchanged.

**Request body**:

```json
{
  "defaultModel": "gpt-4o",
  "apiKeys": {
    "openai": "sk-..."
  }
}
```

**Response**:

```json
{ "success": true }
```

```bash
curl -X PUT http://localhost:3099/api/settings \
  -H "Content-Type: application/json" \
  -d '{"defaultModel":"gpt-4o","apiKeys":{"openai":"sk-..."}}'
```

---

## GET /api/skills

List all discovered skills (global + project-level).

**Response**:

```json
{
  "skills": [
    {
      "name": "Remove Background",
      "command": "/remove-bg",
      "description": "Remove the background from an image with rembg",
      "scope": "project"
    }
  ]
}
```

```bash
curl http://localhost:3099/api/skills
```
