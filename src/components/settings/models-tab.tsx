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
    <div className="space-y-5">
      <h3 className="text-[var(--text-title)] font-semibold mb-4">Models</h3>

      <div>
        <div className="mb-1.5">
          <label className="text-[var(--text-body-sm)] font-medium text-[var(--ink)]">
            Default Model
          </label>
        </div>
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
