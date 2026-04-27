import { z } from "zod";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { getConfig, reloadConfig } from "@/core/config/loader";
import {
  ProviderConfigSchema,
  McpServerConfigSchema,
  HookEntrySchema,
  PermissionConfigSchema,
} from "@/core/config/schema";

const SettingsUpdateSchema = z.object({
  defaultModel: z.string().optional(),
  providers: z.record(ProviderConfigSchema).optional(),
  mcpServers: z.record(McpServerConfigSchema).optional(),
  hooks: z.record(z.array(HookEntrySchema)).optional(),
  permissions: PermissionConfigSchema.partial().optional(),
});

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

function maskKey(key?: string): string {
  if (!key) return "";
  if (key.length <= 8) return "****";
  return "****" + key.slice(-4);
}

export async function GET() {
  const config = getConfig();

  // Mask API keys in provider configs for the response
  const maskedProviders: Record<string, unknown> = {};
  for (const [id, provider] of Object.entries(config.providers)) {
    maskedProviders[id] = {
      ...provider,
      apiKey: maskKey(provider.apiKey),
    };
  }

  return NextResponse.json({
    defaultModel: config.defaultModel,
    providers: maskedProviders,
    mcpServers: config.mcpServers,
    hooks: config.hooks,
    permissions: config.permissions,
    conventionHooks: discoverConventionHooks(),
  });
}

export async function PUT(req: Request) {
  const raw = await req.json();
  const parsed = SettingsUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid settings payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const body = parsed.data;

  let current: Record<string, unknown> = {};
  try {
    current = JSON.parse(fs.readFileSync(GLOBAL_CONFIG_PATH, "utf-8"));
  } catch {
    // File doesn't exist yet
  }

  // Clean up legacy fields on save
  delete current.apiKeys;
  delete current.customProviders;

  if (body.defaultModel !== undefined) {
    current.defaultModel = body.defaultModel;
  }

  if (body.providers !== undefined) {
    // Merge provider keys: skip masked "****" values to avoid overwriting real keys
    const existing = (current.providers ?? {}) as Record<string, Record<string, unknown>>;
    for (const [id, incoming] of Object.entries(body.providers)) {
      const prev = existing[id] as Record<string, unknown> | undefined;
      if (incoming.apiKey.includes("****") && prev?.apiKey) {
        existing[id] = { ...incoming, apiKey: prev.apiKey };
      } else {
        existing[id] = { ...incoming };
      }
    }
    current.providers = existing;
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
