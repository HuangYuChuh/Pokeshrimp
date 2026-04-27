import { z } from "zod";

// ─── Provider config ─────────────────────────────────────────
// Unified shape: preset providers only need apiKey + enabled.
// Custom providers fill in name, baseURL, and models too.

export const ProviderConfigSchema = z.object({
  /** Display name (only needed for custom providers) */
  name: z.string().default(""),
  /** API key */
  apiKey: z.string().default(""),
  /** Base URL override (preset providers have defaults) */
  baseURL: z.string().default(""),
  /** Model IDs (empty = use preset defaults) */
  models: z.array(z.string()).default([]),
  /** Whether this provider is active */
  enabled: z.boolean().default(true),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

// ─── Legacy schemas (kept for migration) ─────────────────────

export const ApiKeysSchema = z.object({
  anthropic: z.string().optional(),
  openai: z.string().optional(),
});

export const CustomProviderSchema = z.object({
  name: z.string(),
  baseURL: z.string(),
  apiKey: z.string().default(""),
  models: z.array(z.string()).default([]),
  enabled: z.boolean().default(true),
});

// ─── Other config sections ───────────────────────────────────

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

// ─── App config ──────────────────────────────────────────────

export const AppConfigSchema = z.object({
  defaultModel: z.string().default("anthropic:claude-sonnet-4-20250514"),
  /** Unified provider map (replaces apiKeys + customProviders) */
  providers: z.record(ProviderConfigSchema).default({}),
  mcpServers: z.record(McpServerConfigSchema).default({}),
  hooks: z.record(z.array(HookEntrySchema)).default({}),
  permissions: PermissionConfigSchema.default({}),
  // Legacy fields — parsed for migration, not used at runtime
  apiKeys: ApiKeysSchema.optional(),
  customProviders: z.record(CustomProviderSchema).optional(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;
export type McpServerConfig = z.infer<typeof McpServerConfigSchema>;
export type HookEntryConfig = z.infer<typeof HookEntrySchema>;
export type CustomProvider = z.infer<typeof CustomProviderSchema>;
