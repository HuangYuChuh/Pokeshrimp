#!/usr/bin/env node

import { createInterface } from "readline";
import { getModel } from "@/core/ai/provider";
import { SYSTEM_PROMPT } from "@/core/ai/streaming";
import { ToolRegistry } from "@/core/tool/registry";
import { registerBuiltinTools } from "@/core/tool/builtin";
import { getConfig } from "@/core/config/loader";
import {
  runAgent,
  createCommandApprovalMiddleware,
  createLoopDetectionMiddleware,
  buildSkillPromptSection,
  type Middleware,
} from "@/core/agent";
import { listSkills } from "@/core/skill/engine";
import type { ToolContext } from "@/core/tool/types";
import path from "path";
import os from "os";

// ─── Setup ───────────────────────────────────────────────────

const config = getConfig();
const registry = new ToolRegistry();
registerBuiltinTools(registry);

const context: ToolContext = {
  cwd: process.cwd(),
};

const middlewares: Middleware[] = [
  createCommandApprovalMiddleware({
    alwaysAllow: config.permissions?.alwaysAllow ?? [],
    alwaysDeny: config.permissions?.alwaysDeny ?? [],
  }),
  createLoopDetectionMiddleware(3),
];

// Build system prompt with skills
const globalSkillsDir = path.join(os.homedir(), ".visagent", "skills");
const projectSkillsDir = path.join(process.cwd(), ".visagent", "skills");
const skills = listSkills(globalSkillsDir, projectSkillsDir);
const skillSection = buildSkillPromptSection(
  skills.map((s) => ({ name: s.name, command: s.command, description: s.description })),
);
const systemPrompt = SYSTEM_PROMPT + skillSection;

// ─── Model ───────────────────────────────────────────────────

let model: ReturnType<typeof getModel>;
try {
  model = getModel(config.defaultModel, {
    anthropic: config.apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY,
    openai: config.apiKeys?.openai || process.env.OPENAI_API_KEY,
  });
} catch {
  console.error("Error: No API key configured.");
  console.error("Set ANTHROPIC_API_KEY env var or add it to ~/.visagent/config.json:");
  console.error('  { "apiKeys": { "anthropic": "sk-ant-..." } }');
  process.exit(1);
}

// ─── REPL ────────────────────────────────────────────────────

const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Pokeshrimp CLI v0.1.0");
console.log("Human use GUI, Agent use CLI, Create use Pokeshrimp.");
console.log('Type your message. Press Ctrl+C to exit.\n');

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
      const result = runAgent(
        {
          model,
          systemPrompt,
          registry,
          context,
          middlewares,
          maxIterations: 32,
        },
        messages,
      );

      let fullText = "";
      for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
        fullText += chunk;
      }
      console.log("\n");

      if (fullText) {
        messages.push({ role: "assistant", content: fullText });
      }
    } catch (err) {
      console.error("\nError:", err instanceof Error ? err.message : err);
    }

    prompt();
  });
}

prompt();
