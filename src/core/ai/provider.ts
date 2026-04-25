import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { ProviderConfig } from "@/core/config/schema";

// ─── Provider preset registry ────────────────────────────────
// All providers are equal. Presets provide default baseURL and
// model catalog so users only need to fill in an API key.

export type ProviderType = "anthropic" | "openai-compatible";

export interface ProviderPreset {
  id: string;
  name: string;
  type: ProviderType;
  baseURL: string;
  icon: string;
  docsUrl: string;
  keyPlaceholder: string;
  defaultModels: { id: string; label: string }[];
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    type: "anthropic",
    baseURL: "https://api.anthropic.com",
    icon: "simple-icons:anthropic",
    docsUrl: "https://console.anthropic.com/settings/keys",
    keyPlaceholder: "sk-ant-...",
    defaultModels: [
      { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    type: "openai-compatible",
    baseURL: "https://api.openai.com/v1",
    icon: "simple-icons:openai",
    docsUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-...",
    defaultModels: [
      { id: "gpt-5.4", label: "GPT-5.4" },
      { id: "gpt-5.4-mini", label: "GPT-5.4 Mini" },
      { id: "gpt-5.4-nano", label: "GPT-5.4 Nano" },
      { id: "gpt-5", label: "GPT-5" },
      { id: "gpt-4.1", label: "GPT-4.1" },
      { id: "o4-mini", label: "o4-mini" },
      { id: "o3-mini", label: "o3-mini" },
    ],
  },
  {
    id: "zhipu",
    name: "智谱 GLM",
    type: "openai-compatible",
    baseURL: "https://open.bigmodel.cn/api/paas/v4",
    icon: "solar:stars-outline",
    docsUrl: "https://open.bigmodel.cn/usercenter/apikeys",
    keyPlaceholder: "xxx.yyy",
    defaultModels: [
      { id: "glm-4-plus", label: "GLM-4-Plus" },
      { id: "glm-4-flash", label: "GLM-4-Flash" },
      { id: "glm-4-long", label: "GLM-4-Long" },
    ],
  },
  {
    id: "minimax",
    name: "MiniMax",
    type: "openai-compatible",
    baseURL: "https://api.minimax.chat/v1",
    icon: "simple-icons:minimax",
    docsUrl: "https://platform.minimaxi.com/user-center/basic-information/interface-key",
    keyPlaceholder: "eyJ...",
    defaultModels: [
      { id: "MiniMax-M1", label: "MiniMax-M1" },
      { id: "abab6.5s-chat", label: "abab6.5s" },
    ],
  },
  {
    id: "qwen",
    name: "通义千问",
    type: "openai-compatible",
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    icon: "simple-icons:alibabadotcom",
    docsUrl: "https://dashscope.console.aliyun.com/apiKey",
    keyPlaceholder: "sk-...",
    defaultModels: [
      { id: "qwen-max", label: "Qwen Max" },
      { id: "qwen-plus", label: "Qwen Plus" },
      { id: "qwen-turbo", label: "Qwen Turbo" },
    ],
  },
  {
    id: "kimi",
    name: "Kimi",
    type: "openai-compatible",
    baseURL: "https://api.moonshot.cn/v1",
    icon: "solar:moon-outline",
    docsUrl: "https://platform.moonshot.cn/console/api-keys",
    keyPlaceholder: "sk-...",
    defaultModels: [
      { id: "moonshot-v1-128k", label: "Moonshot v1 128K" },
      { id: "moonshot-v1-32k", label: "Moonshot v1 32K" },
      { id: "moonshot-v1-8k", label: "Moonshot v1 8K" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    type: "openai-compatible",
    baseURL: "https://api.deepseek.com",
    icon: "solar:waterdrop-outline",
    docsUrl: "https://platform.deepseek.com/api_keys",
    keyPlaceholder: "sk-...",
    defaultModels: [
      { id: "deepseek-chat", label: "DeepSeek V3" },
      { id: "deepseek-reasoner", label: "DeepSeek R1" },
    ],
  },
];

/** Lookup preset by ID */
export function getPreset(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.id === id);
}

// ─── Model option (flat list for UI) ─────────────────────────

export interface ModelOption {
  id: string;
  label: string;
  providerId: string;
  providerName: string;
  modelId: string;
  icon: string;
}

/**
 * Build flat model list from all enabled providers.
 * Model ID format: "{providerId}:{modelId}" — globally unique.
 */
export function buildModelOptions(providers: Record<string, ProviderConfig>): ModelOption[] {
  const options: ModelOption[] = [];

  for (const [providerId, config] of Object.entries(providers)) {
    if (!config.enabled) continue;

    const preset = getPreset(providerId);
    const providerName = config.name || preset?.name || providerId;
    const icon = preset?.icon || "solar:cpu-bolt-outline";

    // Use config.models if set, otherwise fall back to preset defaults
    const models =
      config.models.length > 0
        ? config.models.map((m) => ({ id: m, label: m }))
        : (preset?.defaultModels ?? []);

    for (const model of models) {
      options.push({
        id: `${providerId}:${model.id}`,
        label: model.label,
        providerId,
        providerName,
        modelId: model.id,
        icon,
      });
    }
  }

  return options;
}

/** Legacy compat: MODEL_OPTIONS from presets (no config needed) */
export const MODEL_OPTIONS: ModelOption[] = PROVIDER_PRESETS.flatMap((preset) =>
  preset.defaultModels.map((m) => ({
    id: `${preset.id}:${m.id}`,
    label: m.label,
    providerId: preset.id,
    providerName: preset.name,
    modelId: m.id,
    icon: preset.icon,
  })),
);

// ─── Model resolution ────────────────────────────────────────

export function getModel(
  fullModelId: string,
  providers: Record<string, ProviderConfig>,
): LanguageModel {
  const colonIdx = fullModelId.indexOf(":");
  if (colonIdx === -1) {
    throw new Error(`Invalid model ID format: ${fullModelId} (expected "providerId:modelId")`);
  }

  const providerId = fullModelId.slice(0, colonIdx);
  const modelId = fullModelId.slice(colonIdx + 1);
  const config = providers[providerId];

  if (!config) {
    throw new Error(`Provider not configured: ${providerId}`);
  }

  const preset = getPreset(providerId);
  const type = preset?.type ?? "openai-compatible";

  if (type === "anthropic") {
    const key = config.apiKey || process.env.ANTHROPIC_API_KEY;
    const anthropic = createAnthropic({
      apiKey: key,
      ...(config.baseURL ? { baseURL: config.baseURL } : {}),
    });
    return anthropic(modelId);
  }

  // Everything else is OpenAI-compatible
  const key = config.apiKey || (providerId === "openai" ? process.env.OPENAI_API_KEY : "");
  const baseURL = config.baseURL || preset?.baseURL || "";
  const openai = createOpenAI({ apiKey: key, baseURL });
  return openai(modelId);
}
