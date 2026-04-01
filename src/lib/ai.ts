// Re-export from core — keeps API routes working without changes
import { getModel as coreGetModel } from "@/core/ai/provider";
import { reloadConfig } from "@/core/config/loader";
import type { LanguageModel } from "ai";

export type { ModelProvider, ModelOption } from "@/core/ai/provider";
export { MODEL_OPTIONS } from "@/core/ai/provider";

/**
 * Reads API keys from config (reloaded every call to pick up settings changes).
 * Falls back to environment variables.
 */
export function getModel(modelId?: string): LanguageModel {
  const config = reloadConfig();
  return coreGetModel(
    modelId || config.defaultModel,
    {
      anthropic: config.apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY,
      openai: config.apiKeys?.openai || process.env.OPENAI_API_KEY,
    },
  );
}
