// Client-side mirror of MODEL_OPTIONS from src/lib/ai.ts
// Keep in sync — these are the models shown in the UI dropdown

export interface ModelOption {
  id: string;
  label: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  { id: "claude-sonnet", label: "Claude Sonnet 4" },
  { id: "claude-haiku", label: "Claude Haiku 3.5" },
  { id: "gpt-4o", label: "GPT-4o" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini" },
];
