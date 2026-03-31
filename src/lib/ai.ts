// Re-export from core — keeps API routes working without changes
import { getModel as coreGetModel, MODEL_OPTIONS } from "@/core/ai/provider";
import { getConfig } from "@/core/config/loader";
import type { LanguageModel } from "ai";

export type { ModelProvider, ModelOption } from "@/core/ai/provider";
export { MODEL_OPTIONS } from "@/core/ai/provider";

/**
 * Backward-compatible getModel that reads API keys from config automatically.
 */
export function getModel(modelId?: string): LanguageModel {
  const config = getConfig();
  return coreGetModel(
    modelId || config.defaultModel,
    config.apiKeys,
  );
}
