import { z } from "zod";

export const CustomProviderSchema = z.object({
  /** Display name (e.g. "DeepSeek", "Moonshot", "Local Ollama") */
  name: z.string(),
  /** OpenAI-compatible base URL (e.g. "https://api.deepseek.com/v1") */
  baseURL: z.string(),
  /** API key for this provider */
  apiKey: z.string().default(""),
  /** Model IDs available (e.g. ["deepseek-chat", "deepseek-coder"]) */
  models: z.array(z.string()).default([]),
  /** Whether this provider is active */
  enabled: z.boolean().default(true),
});

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

export const HookEntrySchema = z.object({
  command: z.string(),
  timeout: z.number().default(10_000),
  matcher: z.string().optional(),
});

export const PermissionConfigSchema = z.object({
  alwaysAllow: z.array(z.string()).default([]),
  alwaysDeny: z.array(z.string()).default([]),
  alwaysAsk: z.array(z.string()).default([]),
});

export const AppConfigSchema = z.object({
  defaultModel: z.string().default("claude-sonnet"),
  apiKeys: ApiKeysSchema.default({}),
  /** Custom OpenAI-compatible providers (keyed by provider ID) */
  customProviders: z.record(CustomProviderSchema).default({}),
  mcpServers: z.record(McpServerConfigSchema).default({}),
  hooks: z.record(z.array(HookEntrySchema)).default({}),
  permissions: PermissionConfigSchema.default({}),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;
export type HookEntryConfig = z.infer<typeof HookEntrySchema>;
export type CustomProvider = z.infer<typeof CustomProviderSchema>;
