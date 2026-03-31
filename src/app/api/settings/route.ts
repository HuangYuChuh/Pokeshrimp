import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { getConfig, reloadConfig } from "@/core/config/loader";

const GLOBAL_CONFIG_PATH = path.join(
  os.homedir(),
  ".visagent",
  "config.json"
);

export async function GET() {
  const config = getConfig();
  // Mask API keys for security — only show last 4 chars
  const masked = {
    ...config,
    apiKeys: {
      anthropic: maskKey(config.apiKeys?.anthropic),
      openai: maskKey(config.apiKeys?.openai),
    },
  };
  return NextResponse.json(masked);
}

export async function PUT(req: Request) {
  const body = await req.json();

  // Read current global config
  let current: Record<string, unknown> = {};
  try {
    current = JSON.parse(fs.readFileSync(GLOBAL_CONFIG_PATH, "utf-8"));
  } catch {
    // File doesn't exist yet
  }

  // Merge updates
  if (body.apiKeys) {
    const existing = (current.apiKeys ?? {}) as Record<string, string>;
    // Only update keys that are provided and non-empty
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

  // Ensure directory exists
  const dir = path.dirname(GLOBAL_CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write config
  fs.writeFileSync(GLOBAL_CONFIG_PATH, JSON.stringify(current, null, 2));

  // Reload cached config
  reloadConfig();

  return NextResponse.json({ success: true });
}

function maskKey(key?: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••";
  return "••••" + key.slice(-4);
}
