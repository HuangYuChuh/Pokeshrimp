#!/usr/bin/env node

import { createInterface } from "readline";
import { readFileSync } from "fs";
import { resolve } from "path";
import { getModel } from "@/core/ai/provider";
import { SYSTEM_PROMPT } from "@/core/ai/system-prompt";
import { getConfig } from "@/core/config/loader";
import { getRuntime } from "@/core/init";
import { parseArgs, getHelpText } from "./args";
import { handleInit } from "./init";
import type { CoreMessage } from "ai";

// ─── Parse CLI arguments ────────────────────────────────────

let opts: ReturnType<typeof parseArgs>;
try {
  opts = parseArgs(process.argv);
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

if (opts.help) {
  console.log(getHelpText());
  process.exit(0);
}

if (opts.version) {
  const pkg = JSON.parse(
    readFileSync(resolve(__dirname, "../../package.json"), "utf-8"),
  );
  console.log(pkg.version);
  process.exit(0);
}

// ─── Resolve working directory ──────────────────────────────

if (opts.cwd) {
  process.chdir(resolve(opts.cwd));
}

// ─── Subcommands ───────────────────────────────────────────

if (opts.subcommand === "init") {
  handleInit(opts.message, opts.cwd ? process.cwd() : undefined);
  process.exit(0);
}

// ─── Setup ──────────────────────────────────────────────────

const config = getConfig(opts.cwd ? process.cwd() : undefined);
const runtime = await getRuntime();

const modelId = opts.model ?? config.defaultModel;
let model: ReturnType<typeof getModel>;
try {
  model = getModel(modelId, {
    anthropic: config.apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY,
    openai: config.apiKeys?.openai || process.env.OPENAI_API_KEY,
  });
} catch {
  console.error("Error: No API key configured.");
  console.error(
    "Set ANTHROPIC_API_KEY env var or add it to ~/.visagent/config.json:",
  );
  console.error('  { "apiKeys": { "anthropic": "sk-ant-..." } }');
  process.exit(1);
}

// ─── Detect mode ────────────────────────────────────────────

/**
 * Read all of stdin when piped (non-TTY). Returns undefined if stdin
 * is a terminal (interactive mode).
 */
async function readStdin(): Promise<string | undefined> {
  if (process.stdin.isTTY) return undefined;

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  const text = Buffer.concat(chunks).toString("utf-8").trim();
  return text || undefined;
}

const pipedInput = await readStdin();
const oneshotMessage = opts.message ?? pipedInput;

// ─── One-shot / pipe mode ───────────────────────────────────

if (oneshotMessage) {
  try {
    let responseText = "";
    const result = await runtime.run({
      model,
      systemPrompt: SYSTEM_PROMPT,
      messages: [{ role: "user", content: oneshotMessage }],
      context: { cwd: process.cwd() },
      onIterationStream: async (stream) => {
        for await (const chunk of stream.textStream) {
          responseText += chunk;
          if (!opts.json && !opts.quiet) {
            process.stdout.write(chunk);
          }
        }
      },
    });

    if (opts.json) {
      // Extract tool calls from messages for structured output
      const toolCalls = result.messages
        .filter(
          (m): m is CoreMessage & { role: "assistant" } =>
            m.role === "assistant",
        )
        .flatMap((m) => {
          if (!Array.isArray(m.content)) return [];
          return (m.content as unknown as Array<{ type: string; toolName?: string; args?: unknown }>)
            .filter((part) => part.type === "tool-call")
            .map((part) => ({
              toolName: part.toolName,
              args: part.args,
            }));
        });

      const output = {
        text: result.text,
        toolCalls,
      };
      console.log(JSON.stringify(output, null, 2));
    } else if (opts.quiet) {
      // In quiet mode, print the final text without streaming
      process.stdout.write(result.text);
      if (result.text && !result.text.endsWith("\n")) {
        process.stdout.write("\n");
      }
    } else {
      // Streamed output already printed; just add a trailing newline
      if (responseText && !responseText.endsWith("\n")) {
        process.stdout.write("\n");
      }
    }
    process.exit(0);
  } catch (err) {
    if (opts.json) {
      console.error(
        JSON.stringify({
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    } else {
      console.error(
        "Error:",
        err instanceof Error ? err.message : String(err),
      );
    }
    process.exit(1);
  }
}

// ─── Interactive REPL ───────────────────────────────────────

const messages: CoreMessage[] = [];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

if (!opts.quiet) {
  console.log(`Pokeshrimp CLI v${getVersion()}`);
  console.log("Human use GUI, Agent use CLI, Create use Pokeshrimp.");
  console.log("Type your message. Press Ctrl+C to exit.\n");
}

function getVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(__dirname, "../../package.json"), "utf-8"),
    );
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function prompt() {
  const promptStr = opts.quiet ? "" : "you > ";
  rl.question(promptStr, async (input) => {
    const trimmed = input.trim();
    if (!trimmed) {
      prompt();
      return;
    }

    messages.push({ role: "user", content: trimmed });

    if (!opts.quiet) {
      process.stdout.write("pokeshrimp > ");
    }

    try {
      const result = await runtime.run({
        model,
        systemPrompt: SYSTEM_PROMPT,
        messages,
        context: { cwd: process.cwd() },
        onIterationStream: async (stream) => {
          for await (const chunk of stream.textStream) {
            process.stdout.write(chunk);
          }
        },
      });

      if (!opts.quiet) {
        console.log("\n");
      } else {
        console.log("");
      }

      // Carry the conversation history forward across REPL turns.
      messages.length = 0;
      messages.push(...result.messages);
    } catch (err) {
      console.error("\nError:", err instanceof Error ? err.message : err);
    }

    prompt();
  });
}

prompt();
