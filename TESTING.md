# Pokeshrimp — Test Verification Checklist

Manual QA checklist for verifying all features work on a fresh machine. Go through each section and check off the items.

## Prerequisites

Before testing, make sure:
- [ ] `npm install` completed without errors
- [ ] `npm test` passes (77 automated tests)
- [ ] At least one API key is configured (Anthropic or OpenAI)

---

## 1. App Launch

- [ ] `npm run dev` starts Electron window without crash
- [ ] The chat interface loads (you see "What would you like to create?")
- [ ] The sidebar shows "New task" button and "Recents" section
- [ ] macOS traffic lights (red/yellow/green) are visible top-left

## 2. Settings

- [ ] Click Settings (gear icon in sidebar bottom)
- [ ] Settings dialog opens with Default Model, Anthropic Key, OpenAI Key fields
- [ ] If `ANTHROPIC_API_KEY` env var is set: green hint "Using ANTHROPIC_API_KEY from environment" appears
- [ ] "Get key" link next to Anthropic input opens console.anthropic.com in a new window
- [ ] "Get key" link next to OpenAI input opens platform.openai.com
- [ ] "Login with OpenAI" button appears (Electron only)
- [ ] Saving settings works (shows "Saved!" briefly)

## 3. Chat — Basic Conversation

- [ ] Type a message and press Enter
- [ ] Agent responds with streaming text (words appear gradually)
- [ ] Multiple back-and-forth messages work
- [ ] Session appears in the sidebar under "Recents"
- [ ] Clicking a session in the sidebar loads its conversation

## 4. Chat — Tool Calls

- [ ] Ask the agent to "list files in the current directory"
- [ ] A tool invocation card appears (shows `list_directory` or `run_command`)
- [ ] The card has a green dot when complete
- [ ] Clicking the card expands to show input/output
- [ ] The Editor panel (right side) shows the tool's arguments
- [ ] If output files are detected, they appear in the Output panel

## 5. Slash Commands / Skills

- [ ] Type `/` in the input box
- [ ] A popup appears listing available skills (e.g. /comfyui, /remove-bg)
- [ ] Clicking a skill inserts its command into the input
- [ ] The agent can load a skill's full instructions (uses `read_skill` tool internally)

## 6. Command Approval

To test this, the agent needs to run a command that's NOT in the `alwaysAllow` list.

- [ ] Ask the agent to run an unfamiliar command (e.g. "run `echo hello world`")
- [ ] An approval card appears inline in the chat with the command
- [ ] Risk level is shown (safe/moderate/dangerous)
- [ ] "Allow Once" lets the command run and the conversation continues
- [ ] "Deny" blocks the command and the agent adjusts
- [ ] "Always Allow" saves the pattern (check `.visagent/config.json` afterward)
- [ ] If you wait 60 seconds without clicking: auto-denied

## 7. Designfile

- [ ] Verify `.visagent/designfile.yaml` exists with sample assets
- [ ] Ask the agent "read the designfile" — it should show the asset graph
- [ ] Ask "what needs to be rebuilt?" — it should show a build plan
- [ ] If you have CLI tools installed: ask to rebuild an asset, verify the full cycle:
  1. Agent reads designfile
  2. Agent computes build plan (rebuild_asset tool)
  3. Agent runs the skill for each asset
  4. Agent marks each asset as built (mark_asset_built tool)
  5. Build state is updated (`.visagent/.state.json`)
  6. Version recorded (`.visagent/.history/`)

## 8. CLI

- [ ] Run `npx pokeshrimp` in terminal
- [ ] REPL starts: "Pokeshrimp CLI v0.1.0"
- [ ] Type a message, get a streamed response
- [ ] Tool calls work from CLI too
- [ ] Ctrl+C exits cleanly

## 9. Hooks (optional — requires creating a hook script)

```bash
mkdir -p .visagent/hooks
cat > .visagent/hooks/post-tool-call << 'EOF'
#!/bin/bash
INPUT=$(cat)
TOOL=$(echo "$INPUT" | python3 -c "import sys,json;print(json.load(sys.stdin).get('tool','?'))")
echo "$(date): tool=$TOOL" >> /tmp/pokeshrimp-hooks.log
echo '{}'
EOF
chmod +x .visagent/hooks/post-tool-call
```

- [ ] After creating the hook, trigger a tool call in chat
- [ ] Check `/tmp/pokeshrimp-hooks.log` — it should have a new entry

## 10. Preview Panel (right side)

- [ ] Preview tab: shows "Generated content will appear here" initially
- [ ] After a tool generates an image: the image appears in Preview
- [ ] Editor tab: shows the last tool call's arguments (editable textarea)
- [ ] Output tab: lists detected output files with their types

---

## Automated Tests

These run without any API key or GUI:

```bash
npm test
```

Expected: 77 tests, 6 files, all passing.

| Test file | What it covers |
|---|---|
| `graph.test.ts` | Dependency graph: topo sort, cycles, cascade |
| `state.test.ts` | Build state: dirty detection, persistence |
| `history.test.ts` | Version history: record, list, param diff |
| `checker.test.ts` | Permission: pattern matching, risk assessment |
| `engine.test.ts` | Hooks engine: emit, blocking, timeout |
| `middleware.test.ts` | Middleware chain: approval, loop detection |
