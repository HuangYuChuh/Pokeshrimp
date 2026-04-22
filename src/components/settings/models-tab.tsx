"use client";

import { Icon } from "@iconify/react";
import { Select } from "@/design-system/components";
import { MODEL_OPTIONS } from "@/core/ai/provider";

interface ModelsTabProps {
  defaultModel: string;
  onDefaultModelChange: (model: string) => void;
}

export function ModelsTab({ defaultModel, onDefaultModelChange }: ModelsTabProps) {
  const options = MODEL_OPTIONS.map((m) => ({ value: m.id, label: m.label }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-[var(--gap-inline)]">
        <Icon icon="solar:cpu-bolt-outline" width={18} className="text-[var(--ink-secondary)]" />
        <h3 className="text-[var(--text-headline)] font-semibold text-[var(--ink)]">Models</h3>
      </div>

      <div>
        <label className="mb-2 block text-[var(--text-body-sm)] font-medium text-[var(--ink)]">
          Default Model
        </label>
        <p className="mb-3 text-[var(--text-caption)] text-[var(--ink-tertiary)]">
          Used for new conversations when no model is specified.
        </p>
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
