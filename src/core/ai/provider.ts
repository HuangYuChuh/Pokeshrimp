import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { CustomProvider } from "@/core/config/schema";

export type ModelProvider = "anthropic" | "openai" | "custom";

export interface ModelOption {
  id: string;
  label: string;
  provider: ModelProvider;
  modelId: string;
  /** For custom providers: the provider key in config.customProviders */
  customProviderId?: string;
}

// ─── Built-in models ─────────────────────────────────────────

export const BUILTIN_MODEL_OPTIONS: ModelOption[] = [
  // ─── Anthropic ─────────────────────────────────────────
  {
    id: "claude-sonnet",
    label: "Claude Sonnet 4",
    provider: "anthropic",
    modelId: "claude-sonnet-4-20250514",
  },
  {
    id: "claude-haiku",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    modelId: "claude-haiku-4-5-20251001",
  },
  // ─── OpenAI (verified from developers.openai.com/api/docs/models/all, 2026-04) ───
  {
    id: "gpt-5.4",
    label: "GPT-5.4",
    provider: "openai",
    modelId: "gpt-5.4",
  },
  {
    id: "gpt-5.4-mini",
    label: "GPT-5.4 Mini",
    provider: "openai",
    modelId: "gpt-5.4-mini",
  },
  {
    id: "gpt-5.4-nano",
    label: "GPT-5.4 Nano",
    provider: "openai",
    modelId: "gpt-5.4-nano",
  },
  {
    id: "gpt-5",
    label: "GPT-5",
    provider: "openai",
    modelId: "gpt-5",
  },
  {
    id: "gpt-4.1",
    label: "GPT-4.1",
    provider: "openai",
    modelId: "gpt-4.1",
  },
  {
    id: "o4-mini",
    label: "o4-mini",
    provider: "openai",
    modelId: "o4-mini",
  },
  {
    id: "o3-mini",
    label: "o3-mini",
    provider: "openai",
    modelId: "o3-mini",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o (legacy)",
    provider: "openai",
    modelId: "gpt-4o",
  },
];

/**
 * Build the full model list: built-in + custom providers from config.
 * Custom provider models get a prefixed ID like "custom:deepseek:deepseek-chat".
 */
export function buildModelOptions(
  customProviders?: Record<string, CustomProvider>,
): ModelOption[] {
  const options = [...BUILTIN_MODEL_OPTIONS];

  if (customProviders) {
    for (const [providerId, provider] of Object.entries(customProviders)) {
      if (!provider.enabled) continue;
      for (const modelId of provider.models) {
        options.push({
          id: `custom:${providerId}:${modelId}`,
          label: `${provider.name} / ${modelId}`,
          provider: "custom",
          modelId,
          customProviderId: providerId,
        });
      }
    }
  }

  return options;
}

/** Backward compat: MODEL_OPTIONS without custom providers */
export const MODEL_OPTIONS = BUILTIN_MODEL_OPTIONS;

// ─── Model resolution ────────────────────────────────────────

export function getModel(
  modelId?: string,
  apiKeys?: {
    anthropic?: string;
    openai?: string;
  },
  customProviders?: Record<string, CustomProvider>,
): LanguageModel {
  const selected = modelId || "claude-sonnet";
  const allOptions = buildModelOptions(customProviders);
  const option = allOptions.find((m) => m.id === selected);

  if (!option) {
    throw new Error(`Unknown model: ${selected}`);
  }

  switch (option.provider) {
    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey: apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY,
      });
      return anthropic(option.modelId);
    }
    case "openai": {
      const key = apiKeys?.openai || process.env.OPENAI_API_KEY || "";
      const openai = createOpenAI({ apiKey: key });
      return openai(option.modelId);
    }
    case "custom": {
      if (!option.customProviderId || !customProviders?.[option.customProviderId]) {
        throw new Error(`Custom provider not found: ${option.customProviderId}`);
      }
      const provider = customProviders[option.customProviderId];
      const client = createOpenAI({
        apiKey: provider.apiKey,
        baseURL: provider.baseURL,
      });
      return client(option.modelId);
    }
    default:
      throw new Error(`Unknown provider: ${(option as ModelOption).provider}`);
  }
}
