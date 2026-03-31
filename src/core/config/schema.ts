import { z } from "zod";

export const ApiKeysSchema = z.object({
  anthropic: z.string().optional(),
  openai: z.string().optional(),
});

export const McpServerConfigSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).default([]),
  env: z.record(z.string()).default({}),
  transport: z.enum(["stdio", "sse", "http"]).default("stdio"),
  enabled: z.boolean().default(true),
});

export const HookActionSchema = z.object({
  type: z.literal("command"),
  command: z.string(),
  timeout: z.number().optional(),
});

export const HookConfigSchema = z.object({
  matcher: z.string().optional(),
  hooks: z.array(HookActionSchema),
});

export const PermissionConfigSchema = z.object({
  alwaysAllow: z.array(z.string()).default([]),
  alwaysDeny: z.array(z.string()).default([]),
  alwaysAsk: z.array(z.string()).default([]),
});

export const AppConfigSchema = z.object({
  defaultModel: z.string().default("claude-sonnet"),
  apiKeys: ApiKeysSchema.default({}),
  mcpServers: z.record(McpServerConfigSchema).default({}),
  hooks: z.record(z.array(HookConfigSchema)).default({}),
  permissions: PermissionConfigSchema.default({}),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;
export type HookConfigEntry = z.infer<typeof HookConfigSchema>;
