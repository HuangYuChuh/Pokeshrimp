import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type ModelProvider = "anthropic" | "openai";

/** How the user authenticated with OpenAI. */
export type OpenAIAuthMode = "api-key" | "oauth";

export interface ModelOption {
  id: string;
  label: string;
  provider: ModelProvider;
  modelId: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
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
 * Create a LanguageModel for the given model ID.
 *
 * For OpenAI, the auth mode matters:
 *   - "api-key" (sk-xxx): uses Chat Completions API (/v1/chat/completions)
 *   - "oauth" (OAuth token): uses Responses API (/v1/responses)
 *     The OAuth token from "Login with OpenAI" is a Codex subscription
 *     token that only works with the Responses API, not Chat Completions.
 */
export function getModel(
  modelId?: string,
  apiKeys?: {
    anthropic?: string;
    openai?: string;
    openaiAuthMode?: OpenAIAuthMode;
  },
): LanguageModel {
  const selected = modelId || "claude-sonnet";
  const option = MODEL_OPTIONS.find((m) => m.id === selected);

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
      const authMode = apiKeys?.openaiAuthMode ?? detectAuthMode(key);

      if (authMode === "oauth") {
        // OAuth tokens are ChatGPT session tokens (not API platform keys).
        // They only work against chatgpt.com/backend-api, NOT api.openai.com.
        // This is how OpenClaw does it — verified from their source code.
        const codex = createOpenAI({
          apiKey: key,
          baseURL: "https://chatgpt.com/backend-api",
        });
        return codex.responses(option.modelId);
      }

      // Standard API keys (sk-xxx) use the normal OpenAI API.
      const openai = createOpenAI({ apiKey: key });
      return openai(option.modelId);
    }
    default:
      throw new Error(`Unknown provider: ${(option as ModelOption).provider}`);
  }
}

/**
 * Detect whether a key is an API key (sk-xxx) or an OAuth token.
 * OAuth tokens are JWTs (eyJ...) or opaque tokens from auth.openai.com.
 * API keys start with "sk-".
 */
function detectAuthMode(key: string): OpenAIAuthMode {
  if (!key) return "api-key";
  if (key.startsWith("sk-")) return "api-key";
  // OAuth tokens are typically JWTs or long opaque strings
  return "oauth";
}
