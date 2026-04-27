import fs from "fs";
import path from "path";
import os from "os";
import { AppConfigSchema, type AppConfig } from "./schema";

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = result[key];
    if (
      srcVal !== null &&
      typeof srcVal === "object" &&
      !Array.isArray(srcVal) &&
      tgtVal !== null &&
      typeof tgtVal === "object" &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(tgtVal as Record<string, unknown>, srcVal as Record<string, unknown>);
    } else {
      result[key] = srcVal;
    }
  }
  return result;
}

/**
 * Migrate legacy config shape (apiKeys + customProviders) into
 * the unified providers map. Non-destructive: only fills in
 * providers that don't already exist.
 */
function migrateConfig(config: AppConfig): AppConfig {
  const providers = { ...config.providers };
  let migrated = false;

  // Migrate apiKeys.anthropic → providers.anthropic
  if (config.apiKeys?.anthropic && !providers.anthropic?.apiKey) {
    providers.anthropic = {
      ...providers.anthropic,
      name: "",
      apiKey: config.apiKeys.anthropic,
      baseURL: "",
      models: [],
      enabled: true,
    };
    migrated = true;
  }

  // Migrate apiKeys.openai → providers.openai
  if (config.apiKeys?.openai && !providers.openai?.apiKey) {
    providers.openai = {
      ...providers.openai,
      name: "",
      apiKey: config.apiKeys.openai,
      baseURL: "",
      models: [],
      enabled: true,
    };
    migrated = true;
  }

  // Migrate customProviders → providers
  if (config.customProviders) {
    for (const [id, cp] of Object.entries(config.customProviders)) {
      if (!providers[id]) {
        providers[id] = {
          name: cp.name,
          apiKey: cp.apiKey,
          baseURL: cp.baseURL,
          models: cp.models,
          enabled: cp.enabled,
        };
        migrated = true;
      }
    }
  }

  // Migrate old defaultModel format ("claude-sonnet" → "anthropic:claude-sonnet-4-20250514")
  let defaultModel = config.defaultModel;
  if (defaultModel && !defaultModel.includes(":")) {
    defaultModel = migrateModelId(defaultModel);
    migrated = true;
  }

  if (!migrated) return config;

  return { ...config, providers, defaultModel };
}

/** Map legacy model IDs to new "providerId:modelId" format */
function migrateModelId(oldId: string): string {
  const LEGACY_MAP: Record<string, string> = {
    "claude-sonnet": "anthropic:claude-sonnet-4-20250514",
    "claude-haiku": "anthropic:claude-haiku-4-5-20251001",
    "gpt-5.4": "openai:gpt-5.4",
    "gpt-5.4-mini": "openai:gpt-5.4-mini",
    "gpt-5.4-nano": "openai:gpt-5.4-nano",
    "gpt-5": "openai:gpt-5",
    "gpt-4.1": "openai:gpt-4.1",
    "o4-mini": "openai:o4-mini",
    "o3-mini": "openai:o3-mini",
    "gpt-4o": "openai:gpt-4o",
  };
  return LEGACY_MAP[oldId] ?? `openai:${oldId}`;
}

export function loadConfigFile(filePath: string): Partial<AppConfig> {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);
    const parsed = AppConfigSchema.partial().safeParse(json);
    if (parsed.success) {
      return parsed.data as Partial<AppConfig>;
    }
    return {};
  } catch {
    return {};
  }
}

export function loadConfig(cwd?: string): AppConfig {
  const workDir = cwd ?? process.cwd();

  const globalConfig = loadConfigFile(path.join(os.homedir(), ".visagent", "config.json"));
  const projectConfig = loadConfigFile(path.join(workDir, ".visagent", "config.json"));
  const localConfig = loadConfigFile(path.join(workDir, ".visagent", "config.local.json"));

  const merged = deepMerge(
    deepMerge(globalConfig as Record<string, unknown>, projectConfig as Record<string, unknown>),
    localConfig as Record<string, unknown>,
  );

  const config = AppConfigSchema.parse(merged);
  return migrateConfig(config);
}

let cached: AppConfig | null = null;

export function getConfig(cwd?: string): AppConfig {
  if (!cached) {
    cached = loadConfig(cwd);
  }
  return cached;
}

export function reloadConfig(cwd?: string): AppConfig {
  cached = null;
  return getConfig(cwd);
}
