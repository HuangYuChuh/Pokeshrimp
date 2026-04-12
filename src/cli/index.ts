#!/usr/bin/env node

import { createInterface } from "readline";
import { getModel } from "@/core/ai/provider";
import { SYSTEM_PROMPT } from "@/core/ai/streaming";
import { getConfig } from "@/core/config/loader";
import { getRuntime } from "@/core/init";
import type { CoreMessage } from "ai";

// ─── Setup ───────────────────────────────────────────────────

const config = getConfig();
const runtime = getRuntime();

let model: ReturnType<typeof getModel>;
try {
  model = getModel(config.defaultModel, {
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

// ─── REPL ────────────────────────────────────────────────────

const messages: CoreMessage[] = [];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Pokeshrimp CLI v0.1.0");
console.log("Human use GUI, Agent use CLI, Create use Pokeshrimp.");
console.log("Type your message. Press Ctrl+C to exit.\n");

function prompt() {
  rl.question("you > ", async (input) => {
    const trimmed = input.trim();
    if (!trimmed) {
      prompt();
      return;
    }

    messages.push({ role: "user", content: trimmed });

    process.stdout.write("pokeshrimp > ");

    try {
      const result = await runtime.run({
        model,
        systemPrompt: SYSTEM_PROMPT,
        messages,
        context: { cwd: process.cwd() },
        onIterationStream: async (stream) => {
          // For the CLI we just print text deltas live.
          for await (const chunk of stream.textStream) {
            process.stdout.write(chunk);
          }
        },
      });
      console.log("\n");

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
