"use client";

import { Select } from "@/design-system/components";
import { SettingsSection, SettingsTabHeader } from "@/components/settings-sections";
import { MODEL_OPTIONS } from "@/core/ai/provider";

interface ModelsTabProps {
  defaultModel: string;
  onDefaultModelChange: (model: string) => void;
}

export function ModelsTab({ defaultModel, onDefaultModelChange }: ModelsTabProps) {
  const options = MODEL_OPTIONS.map((model) => ({ value: model.id, label: model.label }));

  return (
    <div className="flex min-w-0 flex-col gap-[var(--space-8)]">
      <SettingsTabHeader
        title="Models"
        description="Choose the default model for new conversations."
      />

      <SettingsSection label="Default Model">
        <Select
          value={defaultModel}
          onChange={onDefaultModelChange}
          options={options}
          className="w-full"
        />
      </SettingsSection>
    </div>
  );
}
