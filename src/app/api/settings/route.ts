import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { getConfig, reloadConfig } from "@/core/config/loader";

const GLOBAL_CONFIG_PATH = path.join(os.homedir(), ".visagent", "config.json");

const KNOWN_HOOK_EVENTS = [
  "session-start",
  "pre-tool-call",
  "post-tool-call",
  "post-generate",
  "pre-export",
  "on-error",
  "on-approve",
  "session-end",
];

function discoverConventionHooks(): string[] {
  const hooksDir = path.join(process.cwd(), ".visagent", "hooks");
  const found: string[] = [];
  try {
    if (!fs.existsSync(hooksDir)) return found;
    for (const filename of fs.readdirSync(hooksDir)) {
      if (KNOWN_HOOK_EVENTS.includes(filename)) {
        const filePath = path.join(hooksDir, filename);
        try {
          if (fs.statSync(filePath).isFile()) found.push(filename);
        } catch {
          // skip
        }
      }
    }
  } catch {
    // skip
  }
  return found;
}

export async function GET() {
  const config = getConfig();
  return NextResponse.json({
    ...config,
    apiKeys: {
      anthropic: maskKey(config.apiKeys?.anthropic),
      openai: maskKey(config.apiKeys?.openai),
    },
    envKeys: {
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
    },
    conventionHooks: discoverConventionHooks(),
  });
}

export async function PUT(req: Request) {
  const body = await req.json();

  let current: Record<string, unknown> = {};
  try {
    current = JSON.parse(fs.readFileSync(GLOBAL_CONFIG_PATH, "utf-8"));
  } catch {
    // File doesn't exist yet
  }

  if (body.apiKeys) {
    const existing = (current.apiKeys ?? {}) as Record<string, string>;
    if (body.apiKeys.anthropic !== undefined && body.apiKeys.anthropic !== "") {
      existing.anthropic = body.apiKeys.anthropic;
    }
    if (body.apiKeys.openai !== undefined && body.apiKeys.openai !== "") {
      existing.openai = body.apiKeys.openai;
    }
    current.apiKeys = existing;
  }

  if (body.defaultModel !== undefined) {
    current.defaultModel = body.defaultModel;
  }

  if (body.mcpServers !== undefined) {
    current.mcpServers = body.mcpServers;
  }

  if (body.hooks !== undefined) {
    current.hooks = body.hooks;
  }

  if (body.permissions !== undefined) {
    current.permissions = body.permissions;
  }

  const dir = path.dirname(GLOBAL_CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify(current, null, 2));
  reloadConfig();

  return NextResponse.json({ success: true });
}

function maskKey(key?: string): string {
  if (!key) return "";
  if (key.length <= 8) return "****";
  return "****" + key.slice(-4);
}
