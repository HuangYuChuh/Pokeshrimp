"use client";

import { Select } from "@/design-system/components";
import { MODEL_OPTIONS } from "@/core/ai/provider";

interface ModelsTabProps {
  defaultModel: string;
  onDefaultModelChange: (model: string) => void;
}

export function ModelsTab({ defaultModel, onDefaultModelChange }: ModelsTabProps) {
  const options = MODEL_OPTIONS.map((m) => ({ value: m.id, label: m.label }));

  return (
    <div>
      <h3 className="text-[var(--text-headline)] font-semibold text-[var(--ink)]">Models</h3>
      <p className="mt-1 text-[var(--text-body-sm)] text-[var(--ink-tertiary)]">
        Choose the default model for new conversations.
      </p>

      <div className="mt-8">
        <label className="block text-[var(--text-title)] font-medium text-[var(--ink)] mb-2">
          Default Model
        </label>
        <Select
          value={defaultModel}
          onChange={onDefaultModelChange}
          options={options}
          className="w-full"
        />
      </div>
    </div>
  );
}
