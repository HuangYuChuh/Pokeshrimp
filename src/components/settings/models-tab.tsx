"use client";

import { useMemo } from "react";
import { Select } from "@/design-system/components";
import { SettingsSection, SettingsTabHeader } from "@/components/settings-sections";
import { buildModelOptions } from "@/core/ai/provider";
import { useT } from "@/lib/i18n";
import type { ProviderConfig } from "@/core/config/schema";

interface ModelsTabProps {
  defaultModel: string;
  providers: Record<string, ProviderConfig>;
  onDefaultModelChange: (model: string) => void;
}

export function ModelsTab({ defaultModel, providers, onDefaultModelChange }: ModelsTabProps) {
  const t = useT();

  const options = useMemo(() => {
    const models = buildModelOptions(providers);
    return models.map((m) => ({
      value: m.id,
      label: `${m.providerName} / ${m.label}`,
    }));
  }, [providers]);

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
