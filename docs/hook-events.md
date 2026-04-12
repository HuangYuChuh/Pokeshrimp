# Hook Events Reference

Pokeshrimp dispatches 8 named lifecycle events to user-configured shell scripts. Hook scripts receive a JSON payload on **stdin** and may return a JSON response on **stdout**.

Hook scripts are discovered from two sources:
1. **Config** — `hooks` object in `.visagent/config.json` or `~/.visagent/config.json`
2. **Convention directory** — executable files in `.visagent/hooks/` named after an event

See `src/core/hooks/types.ts` for type definitions and `src/core/hooks/engine.ts` for the execution engine.

---

## Event Summary

| Event | When it fires | Can block? |
|-------|---------------|------------|
| `session-start` | At the beginning of `AgentRuntime.run()` | No |
| `pre-tool-call` | Before every tool invocation | **Yes** (can deny or modify input) |
| `post-tool-call` | After every tool invocation | No |
| `post-generate` | After `run_command` produces visual asset files | No |
| `pre-export` | Before an export operation | **Yes** (can deny) |
| `on-error` | When a tool invocation fails | No |
| `on-approve` | When the user approves a command | No |
| `session-end` | After the `AgentRuntime.run()` loop completes | No |

---

## Blocking vs Non-blocking

Two events are **blocking**: `pre-tool-call` and `pre-export`. For these events, the hook script's stdout JSON can include `"decision": "deny"` to prevent the operation, or `"modified_input": {...}` to rewrite the tool input before execution.

All other events are **fire-and-forget** — the response is ignored and the hook cannot affect the operation.

---

## stdin Payload Shape

Every hook receives a `HookPayload` JSON object on stdin:

```typescript
interface HookPayload {
  event: string;       // The event name
  tool?: string;       // Tool name (for tool-related events)
  input?: unknown;     // Tool input arguments
  result?: unknown;    // Tool result (post-tool-call only)
  command?: string;    // Shell command string (post-generate)
  output_files?: string[]; // Detected output file paths (post-generate)
  output_path?: string;    // Export destination (pre-export)
  error?: string;      // Error message (on-error)
  decision?: string;   // Approval decision (on-approve)
  session_id?: string; // Session ID (session-start, session-end)
  cwd: string;         // Working directory (always present)
}
```

## stdout Response Shape

For **blocking** events, the script should print a JSON object:

```typescript
interface HookResponse {
  decision?: "allow" | "deny";   // Allow or deny the operation
  reason?: string;               // Human-readable reason (shown to user on deny)
  modified_input?: unknown;      // Rewritten tool input (pre-tool-call only)
  message?: string;              // Optional message to log
}
```

For **non-blocking** events, stdout is ignored. Printing `{}` or nothing is fine.

---

## Event Details

### session-start

Fires once at the beginning of `AgentRuntime.run()`, before any LLM calls.

**stdin payload**:
```json
{
  "event": "session-start",
  "cwd": "/path/to/project"
}
```

**Use case**: Initialize logging, check prerequisites, set up workspace.

---

### pre-tool-call

Fires before every tool invocation. This is a **blocking** event — the script can deny the call or modify its input.

**stdin payload**:
```json
{
  "event": "pre-tool-call",
  "tool": "run_command",
  "input": { "command": "ffmpeg -i input.mp4 output.gif" },
  "cwd": "/path/to/project"
}
```

**stdout response** (blocking):
```json
{ "decision": "allow" }
```
or
```json
{ "decision": "deny", "reason": "ffmpeg not installed" }
```
or
```json
{ "decision": "allow", "modified_input": { "command": "ffmpeg -i input.mp4 -quality 90 output.gif" } }
```

**Use case**: Validate commands, inject default flags, block dangerous operations.

---

### post-tool-call

Fires after every tool invocation completes (success or failure). Non-blocking.

**stdin payload**:
```json
{
  "event": "post-tool-call",
  "tool": "write_file",
  "input": { "path": "output.png", "content": "..." },
  "result": { "success": true, "data": "File written" },
  "cwd": "/path/to/project"
}
```

**Use case**: Audit logging, metrics collection, notification triggers.

---

### post-generate

Fires after `run_command` produces output files with visual media extensions (`.png`, `.jpg`, `.mp4`, `.svg`, etc.). Detected by scanning the command string and stdout for file paths. Non-blocking.

**stdin payload**:
```json
{
  "event": "post-generate",
  "tool": "run_command",
  "command": "rembg i photo.jpg output.png",
  "output_files": ["output.png"],
  "cwd": "/path/to/project"
}
```

**Use case**: Auto-add watermarks, copy to output folder, update asset registry, trigger preview refresh.

---

### pre-export

Fires before an export operation. This is a **blocking** event.

**stdin payload**:
```json
{
  "event": "pre-export",
  "output_path": "/path/to/export/final.png",
  "cwd": "/path/to/project"
}
```

**stdout response** (blocking):
```json
{ "decision": "allow" }
```
or
```json
{ "decision": "deny", "reason": "Export path outside project directory" }
```

**Use case**: Validate export paths, enforce naming conventions, check disk space.

---

### on-error

Fires when a tool invocation fails. Non-blocking.

**stdin payload**:
```json
{
  "event": "on-error",
  "tool": "run_command",
  "input": { "command": "comfyui-cli generate" },
  "error": "Command exited with code 1",
  "cwd": "/path/to/project"
}
```

**Use case**: Error reporting, alerting, automatic retry logic (via external orchestration).

---

### on-approve

Fires when the user approves a command through the interactive approval UI. Non-blocking.

**stdin payload**:
```json
{
  "event": "on-approve",
  "tool": "run_command",
  "command": "ffmpeg -i input.mp4 output.gif",
  "decision": "always-allow",
  "cwd": "/path/to/project"
}
```

**Use case**: Audit trail of user approvals, learning user preferences.

---

### session-end

Fires once after the `AgentRuntime.run()` loop completes. Non-blocking.

**stdin payload**:
```json
{
  "event": "session-end",
  "session_id": "session-uuid",
  "cwd": "/path/to/project"
}
```

**Use case**: Clean up temporary files, finalize logs, send session summary.

---

## Configuration

### Option A: Convention directory

Place executable scripts in `.visagent/hooks/` named after the event:

```bash
#!/bin/bash
# .visagent/hooks/post-generate
INPUT=$(cat)
echo "$INPUT" >> /tmp/pokeshrimp-generate.log
echo '{}'
```

Make the script executable: `chmod +x .visagent/hooks/post-generate`

### Option B: Config file

Add entries to the `hooks` object in `.visagent/config.json`:

```json
{
  "hooks": {
    "pre-tool-call": [
      {
        "command": "./scripts/validate-tool.sh",
        "timeout": 5000,
        "matcher": "run_command"
      }
    ],
    "post-generate": [
      {
        "command": "./scripts/add-watermark.sh",
        "timeout": 10000
      }
    ]
  }
}
```

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `command` | `string` | (required) | Shell command to run |
| `timeout` | `number` | `10000` | Timeout in milliseconds |
| `matcher` | `string` | (none) | Filter by tool name (pipe-separated list) or command glob pattern |

## Error Handling

Hook failures never crash the agent runtime. If a script exits with a non-zero code, times out, or returns invalid JSON, the hook is silently skipped and execution continues normally.
