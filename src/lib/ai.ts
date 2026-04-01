// Re-export from core — keeps API routes working without changes
import { getModel as coreGetModel, MODEL_OPTIONS } from "@/core/ai/provider";
import { getConfig } from "@/core/config/loader";
import type { LanguageModel } from "ai";

export type { ModelProvider, ModelOption } from "@/core/ai/provider";
export { MODEL_OPTIONS } from "@/core/ai/provider";

/**
 * Backward-compatible getModel that reads API keys from config automatically.
 * Always reloads config to pick up changes from settings page.
 */
export function getModel(modelId?: string): LanguageModel {
  const { reloadConfig } = require("@/core/config/loader");
  const config = reloadConfig();
  return coreGetModel(
    modelId || config.defaultModel,
    {
      anthropic: config.apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY,
      openai: config.apiKeys?.openai || process.env.OPENAI_API_KEY,
    },
  );
}
