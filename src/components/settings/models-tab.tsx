"use client";

import { Select } from "@/design-system/components";
import { SettingsSection, SettingsTabHeader } from "@/components/settings-sections";
import { MODEL_OPTIONS } from "@/core/ai/provider";
import { useT } from "@/lib/i18n";

interface ModelsTabProps {
  defaultModel: string;
  onDefaultModelChange: (model: string) => void;
}

export function ModelsTab({ defaultModel, onDefaultModelChange }: ModelsTabProps) {
  const t = useT();
  const options = MODEL_OPTIONS.map((model) => ({ value: model.id, label: model.label }));

  return (
    <div className="flex min-w-0 flex-col gap-[var(--space-8)]">
      <SettingsTabHeader title={t.models} description={t.modelsDescription} />

      <SettingsSection label={t.defaultModel}>
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
