import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { getConfig } from "./config";

export type ModelProvider = "anthropic" | "openai";

export interface ModelOption {
  id: string;
  label: string;
  provider: ModelProvider;
  modelId: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "claude-sonnet",
    label: "Claude Sonnet 4",
    provider: "anthropic",
    modelId: "claude-sonnet-4-20250514",
  },
  {
    id: "claude-haiku",
    label: "Claude Haiku 3.5",
    provider: "anthropic",
    modelId: "claude-haiku-4-5-20251001",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    modelId: "gpt-4o",
  },
  {
    id: "gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "openai",
    modelId: "gpt-4o-mini",
  },
];

export function getModel(modelId?: string): LanguageModel {
  const config = getConfig();
  const selected = modelId || config.defaultModel || "claude-sonnet";
  const option = MODEL_OPTIONS.find((m) => m.id === selected);

  if (!option) {
    throw new Error(`Unknown model: ${selected}`);
  }

  switch (option.provider) {
    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey: config.apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY,
      });
      return anthropic(option.modelId);
    }
    case "openai": {
      const openai = createOpenAI({
        apiKey: config.apiKeys?.openai || process.env.OPENAI_API_KEY,
      });
      return openai(option.modelId);
    }
    default:
      throw new Error(`Unknown provider: ${option.provider}`);
  }
}
