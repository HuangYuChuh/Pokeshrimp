# Skill File Format (`.skill.md`)

A **skill file** teaches the Pokeshrimp Agent how to use a command-line tool.
It is the primary extension mechanism of the project: adding a new image or
video tool is as simple as dropping a `*.skill.md` file into a skills
directory — no code changes required.

This document is the canonical reference for the file format. It describes
the required structure, every frontmatter field, the body conventions, how
the Agent loads and uses skills, and shows complete working examples.

## 1. File structure

A skill file is a UTF-8 Markdown file whose name ends in `.skill.md`:

```
<any-name>.skill.md
```

It has two sections:

1. **YAML frontmatter** — delimited by two `---` lines at the very start of
   the file. Metadata about the skill (name, command, parameters, etc.).
2. **Markdown body** — everything after the closing `---`. Free-form
   instructions the Agent reads when it decides to invoke the skill.

```markdown
---
name: ComfyUI Image Generation
command: /comfyui
description: Drive ComfyUI workflows from the CLI
requiredCLI: comfyui-skill
---

## How to use comfyui-skill

Write the step-by-step instructions here...
```

Because the frontmatter is parsed by the [`yaml`](https://www.npmjs.com/package/yaml)
package, **all standard YAML features are available**: nested objects,
multiline strings (`|` and `>`), comments (`#`), quoted values containing
colons, booleans, numbers, and so on.

> The skill file must begin with `---` on its own line. If the opening or
> closing fence is missing, the file is treated as if it had no frontmatter
> and will be rejected (both `name` and `command` are required).

## 2. Frontmatter fields

| Field           | Type                     | Required | Purpose                                                                     |
| --------------- | ------------------------ | -------- | --------------------------------------------------------------------------- |
| `name`          | string                   | yes      | Human-readable display name shown in the UI and in the injected prompt.     |
| `command`       | string                   | yes      | Slash command used to invoke the skill (e.g. `/comfyui`). Must be unique.   |
| `description`   | string                   | no       | One-line summary shown next to the skill in lists and the system prompt.    |
| `requiredCLI`   | string                   | no       | Name of the underlying CLI tool the user must have installed.               |
| `requiredTools` | array of string          | no       | Pokeshrimp built-in tools this skill needs (e.g. `run_command`, `read_file`). |
| `inputParams`   | array of parameter specs | no       | Named inputs the skill accepts. See §2.1.                                   |
| `outputs`       | array of output specs    | no       | What the skill produces. See §2.2.                                          |

All fields other than `name` and `command` are optional. Unknown fields are
preserved in memory but ignored by the current runtime — you may add custom
metadata safely.

### 2.1 `inputParams`

Each entry is an object with these keys:

| Key           | Type   | Required | Purpose                                                         |
| ------------- | ------ | -------- | --------------------------------------------------------------- |
| `name`        | string | yes      | Parameter identifier. Used as the `{{name}}` placeholder key.   |
| `type`        | string | yes      | Expected type (`string`, `int`, `float`, `bool`, `path`, ...).  |
| `description` | string | no       | What the parameter is and how it affects behavior.              |
| `default`     | string | no       | Default value when the caller omits the parameter.              |

```yaml
inputParams:
  - name: prompt
    type: string
    description: Positive prompt describing what to generate
  - name: seed
    type: int
    description: Random seed; -1 means random
    default: "-1"
  - name: steps
    type: int
    default: "20"
```

> `default` is stored as a string. Types are informational — they are passed
> to the model in the system prompt so it can validate arguments before
> invoking the skill.

### 2.2 `outputs`

Each entry is an object with:

| Key           | Type   | Required | Purpose                                                    |
| ------------- | ------ | -------- | ---------------------------------------------------------- |
| `type`        | string | yes      | Output category, e.g. `image`, `video`, `audio`, `file`.   |
| `description` | string | no       | What the caller receives and where to find it.             |

```yaml
outputs:
  - type: image
    description: PNG file written to the output directory
  - type: json
    description: Metadata including seed, prompt and latency
```

## 3. Body conventions

The body below the frontmatter is plain Markdown. When the Agent decides to
use a skill it reads the body verbatim and uses it as its plan, so write it
like a focused runbook rather than a reference manual.

Recommended sections (all optional):

- **Prerequisites / installation** — how to install the underlying CLI.
- **Step-by-step usage** — the canonical commands, one section per step.
- **Parameter notes** — expand on each `inputParams` entry.
- **Gotchas** — platform caveats, required working directories, rate limits.

### 3.1 Parameter placeholders: `{{param}}`

When the body references an input parameter, wrap its name in double curly
braces. This is the substitution convention used throughout Pokeshrimp:

```markdown
Run the txt2img workflow with the user's prompt:

    comfyui-skill run local/txt2img --args '{"prompt": "{{prompt}}", "seed": {{seed}}}' --json
```

At invocation time the runtime replaces each `{{name}}` with the value the
user (or the Agent) supplied for that parameter. Any parameter not declared
in `inputParams` is left as-is.

### 3.2 Command blocks

Put shell commands in fenced code blocks with a `bash` hint. The Agent uses
these as templates for the `run_command` tool:

````markdown
```bash
rembg p {{input_dir}}/ {{output_dir}}/ -m isnet-general-use
```
````

### 3.3 Multiline strings in frontmatter

If a field needs a multi-line value (rare, but supported), use YAML block
scalars:

```yaml
description: |
  Generate images with ComfyUI.
  Supports txt2img, img2img, and custom workflows.
```

## 4. Two-level scope: global vs. project

Skills are loaded from two directories:

| Scope   | Path                 | When to use                                           |
| ------- | -------------------- | ----------------------------------------------------- |
| global  | `~/.visagent/skills/` | Reusable across every project on your machine.        |
| project | `.visagent/skills/`  | Specific to the current project; committed via Git.   |

**Project-level skills override global skills** with the same `command`.
This lets a team pin a stable, version-controlled variant of a skill
without disturbing personal global ones.

Concretely, the loader (`src/core/skill/engine.ts`):

1. Reads every `*.skill.md` from `globalDir` and stores it by `command`.
2. Reads every `*.skill.md` from `projectDir`, overwriting any global entry
   that shares a command.
3. Returns the merged list.

## 5. How the Agent uses skills

Per the architecture in `docs/01-设计哲学与技术架构.md` §3.4:

1. **At conversation start**, the `SkillInjectionMiddleware` iterates over
   every loaded skill and injects a compact list of `name`, `command`, and
   `description` entries into the system prompt. The full bodies are **not**
   injected — this keeps the context budget small even with many skills
   installed.
2. When the Agent decides a skill is relevant, it calls the built-in
   `read_skill` tool with the skill's `command` (e.g. `/comfyui`). The tool
   returns the full body, including every section you wrote.
3. The Agent then executes the steps, substituting `{{param}}` placeholders
   with values from the user request, and invokes the underlying CLI through
   `run_command` (subject to the permission system).

This "inject summary, load on demand" pattern is the reason the body should
be a tight runbook: it is only read when it is actually needed, so feel free
to be thorough without worrying about polluting every conversation.

## 6. Example: simple skill

`batch-remove-bg.skill.md` — a one-tool skill with no parameters declared:

```markdown
---
name: Batch Background Removal
command: /remove-bg
description: Remove backgrounds from images using rembg, output transparent PNG
requiredCLI: rembg
requiredTools:
  - run_command
---

## Install

    pip install rembg[cli]

## Single image

    rembg i input.png output.png

## Whole directory

    rembg p input_dir/ output_dir/

Handles jpg, png, and webp automatically; outputs transparent PNG.

## Common flags

- `-m <model>` — pick a model. Default `u2net`; `isnet-general-use` is more
  precise for hair and transparent objects.
- `-ae <size>` — auto-crop to content and expand by N pixels.
- `-om` — output only the mask (black-and-white).

## Notes

- First run downloads the model (~170 MB).
- Output is always PNG (alpha channel required).
```

## 7. Example: complex skill with parameters

`comfyui.skill.md` — multiple inputs, typed outputs, and `{{param}}`
substitution in the body:

```markdown
---
name: ComfyUI Image Generation
command: /comfyui
description: Run ComfyUI workflows via comfyui-skill to generate images, audio, and video
requiredCLI: comfyui-skill
requiredTools:
  - run_command
  - read_file
inputParams:
  - name: workflow
    type: string
    description: Workflow id, formatted as <server_id>/<workflow_id>
    default: local/txt2img
  - name: prompt
    type: string
    description: Positive prompt
  - name: negative_prompt
    type: string
    description: Negative prompt
    default: ""
  - name: seed
    type: int
    description: Random seed (-1 for random)
    default: "-1"
  - name: steps
    type: int
    default: "20"
outputs:
  - type: image
    description: Generated file written under the configured output_dir
  - type: json
    description: Run metadata (seed, latency, output paths)
---

## Prerequisites

- `pipx install comfyui-skill-cli`
- A running ComfyUI server (default `http://127.0.0.1:8188`)
- Run commands from a directory containing `config.json` and `data/`

## Step 1 — confirm the server is up

    comfyui-skill server status --json

## Step 2 — inspect the target workflow

    comfyui-skill info {{workflow}} --json

Use this to validate that the workflow accepts `prompt`, `negative_prompt`,
`seed`, and `steps`.

## Step 3 — run the workflow

    comfyui-skill run {{workflow}} \
      --args '{"prompt": "{{prompt}}", "negative_prompt": "{{negative_prompt}}", "seed": {{seed}}, "steps": {{steps}}}' \
      --json

The JSON result's `outputs[].local_path` points at the generated file.

## Notes

- For long-running workflows use `submit` + `status` instead of `run`.
- `--output-format stream-json` emits real-time progress events.
```

## 8. Validation checklist

Before committing a new skill file, verify:

- [ ] Filename ends in `.skill.md` and lives in `.visagent/skills/` (project)
      or `~/.visagent/skills/` (global).
- [ ] Opens with `---` on the first line and closes with another `---` on
      its own line.
- [ ] `name` and `command` are present and non-empty.
- [ ] `command` starts with `/` and is unique within its scope.
- [ ] The frontmatter is valid YAML (run it through any YAML linter if
      unsure — `yaml` will reject anything non-standard).
- [ ] Every `{{placeholder}}` in the body corresponds to an entry in
      `inputParams` (otherwise it will not be substituted).
- [ ] Shell commands are inside fenced code blocks or indented literal
      blocks so the Agent can extract them cleanly.

## 9. Related source files

- `src/core/skill/types.ts` — TypeScript interfaces for `Skill`,
  `SkillInputParam`, `SkillOutput`.
- `src/core/skill/engine.ts` — frontmatter parser, two-level loader, lookup
  helpers.
- `src/core/agent/middleware.ts` — `SkillInjectionMiddleware` that injects
  skill summaries at conversation start.
- `src/core/tool/builtin/read-skill.ts` — the `read_skill` tool the Agent
  calls to fetch a full skill body on demand.
