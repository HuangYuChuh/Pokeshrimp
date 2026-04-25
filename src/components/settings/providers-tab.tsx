"use client";

import { useCallback, useState } from "react";
import { Button, Card, CardContent, Input, Switch } from "@/design-system/components";
import { SettingsSection, SettingsTabHeader } from "@/components/settings-sections";
import { Icon } from "@iconify/react";
import { useT } from "@/lib/i18n";
import { PROVIDER_PRESETS } from "@/core/ai/provider";
import type { ProviderConfig } from "@/core/config/schema";

interface ProvidersTabProps {
  providers: Record<string, ProviderConfig>;
  onProvidersChange: (providers: Record<string, ProviderConfig>) => void;
}

function openUrl(url: string) {
  if (window.pokeshrimp?.auth?.openBrowser) {
    window.pokeshrimp.auth.openBrowser(url);
  } else {
    window.open(url, "_blank");
  }
}

const EMPTY_PROVIDER: ProviderConfig = {
  name: "",
  apiKey: "",
  baseURL: "",
  models: [],
  enabled: true,
};

export function ProvidersTab({ providers, onProvidersChange }: ProvidersTabProps) {
  const t = useT();
  const [addingCustom, setAddingCustom] = useState(false);
  const [customId, setCustomId] = useState("");
  const [customName, setCustomName] = useState("");
  const [customBaseURL, setCustomBaseURL] = useState("");
  const [customModels, setCustomModels] = useState("");

  const updateProvider = useCallback(
    (id: string, patch: Partial<ProviderConfig>) => {
      const updated = { ...providers };
      updated[id] = { ...(updated[id] || EMPTY_PROVIDER), ...patch };
      onProvidersChange(updated);
    },
    [providers, onProvidersChange],
  );

  const removeProvider = useCallback(
    (id: string) => {
      const updated = { ...providers };
      delete updated[id];
      onProvidersChange(updated);
    },
    [providers, onProvidersChange],
  );

  const handleAddCustom = useCallback(() => {
    if (!customId.trim() || !customName.trim() || !customBaseURL.trim()) return;
    const id = customId.trim().toLowerCase().replace(/\s+/g, "-");
    updateProvider(id, {
      name: customName.trim(),
      baseURL: customBaseURL.trim(),
      models: customModels
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
      enabled: true,
    });
    setAddingCustom(false);
    setCustomId("");
    setCustomName("");
    setCustomBaseURL("");
    setCustomModels("");
  }, [customId, customName, customBaseURL, customModels, updateProvider]);

  // Split into preset providers and custom providers
  const presetIds = new Set(PROVIDER_PRESETS.map((p) => p.id));
  const customProviderEntries = Object.entries(providers).filter(([id]) => !presetIds.has(id));

  return (
    <div className="flex min-w-0 flex-col gap-[var(--space-8)]">
      <SettingsTabHeader title={t.providers} description={t.providersDescription} />

      {/* ── Preset providers ── */}
      <div className="flex min-w-0 flex-col gap-[var(--space-4)]">
        {PROVIDER_PRESETS.map((preset) => {
          const config = providers[preset.id];
          const isConfigured = !!config?.apiKey;
          const isEnabled = config?.enabled ?? false;

          return (
            <ProviderCard
              key={preset.id}
              icon={preset.icon}
              name={preset.name}
              hint={`${preset.defaultModels.length} ${t.modelsAvailable}`}
              docsUrl={preset.docsUrl}
              apiKey={config?.apiKey ?? ""}
              keyPlaceholder={preset.keyPlaceholder}
              isConfigured={isConfigured}
              isEnabled={isEnabled}
              onApiKeyChange={(key) => updateProvider(preset.id, { apiKey: key })}
              onToggle={() => updateProvider(preset.id, { enabled: !isEnabled })}
            />
          );
        })}
      </div>

      {/* ── Custom providers ── */}
      {customProviderEntries.length > 0 && (
        <div className="flex min-w-0 flex-col gap-[var(--space-4)]">
          <div className="text-[var(--text-title)] font-medium text-[var(--ink)]">
            {t.customProviders}
          </div>
          {customProviderEntries.map(([id, config]) => (
            <Card key={id} className="overflow-hidden">
              <CardContent className="flex min-w-0 flex-col gap-[var(--space-3)] p-[var(--padding-card)]">
                <div className="flex min-w-0 items-center justify-between gap-[var(--space-3)]">
                  <div className="flex min-w-0 items-center gap-[var(--space-3)]">
                    <Icon
                      icon="solar:cpu-bolt-outline"
                      width={18}
                      className="shrink-0 text-[var(--ink-secondary)]"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[var(--text-body-sm)] font-medium text-[var(--ink)]">
                        {config.name || id}
                      </div>
                      <div className="truncate font-[family-name:var(--font-mono)] text-[var(--text-caption)] text-[var(--ink-tertiary)]">
                        {config.baseURL}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-[var(--space-2)]">
                    <Switch
                      checked={config.enabled}
                      onChange={() => updateProvider(id, { enabled: !config.enabled })}
                      aria-label={`Toggle ${config.name || id}`}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeProvider(id)}
                      className="h-[var(--space-6)] w-[var(--space-6)] min-w-0 p-0"
                      aria-label={`Remove ${config.name || id}`}
                    >
                      <Icon icon="solar:trash-bin-2-outline" width={13} />
                    </Button>
                  </div>
                </div>

                <Input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => updateProvider(id, { apiKey: e.target.value })}
                  placeholder="API key"
                  onFocus={(e) => {
                    if ((e.target as HTMLInputElement).value.includes("****"))
                      updateProvider(id, { apiKey: "" });
                  }}
                  className="w-full font-[family-name:var(--font-mono)]"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Add custom provider ── */}
      {addingCustom ? (
        <Card>
          <CardContent className="flex min-w-0 flex-col gap-[var(--space-3)] p-[var(--padding-card)]">
            <SettingsSection label={t.providerId} htmlFor="custom-provider-id">
              <Input
                id="custom-provider-id"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="my-provider"
                className="w-full font-[family-name:var(--font-mono)]"
              />
            </SettingsSection>

            <SettingsSection label={t.providerName} htmlFor="custom-provider-name">
              <Input
                id="custom-provider-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="My Provider"
                className="w-full"
              />
            </SettingsSection>

            <SettingsSection label={t.baseURL} htmlFor="custom-provider-url">
              <Input
                id="custom-provider-url"
                value={customBaseURL}
                onChange={(e) => setCustomBaseURL(e.target.value)}
                placeholder="https://api.example.com/v1"
                className="w-full font-[family-name:var(--font-mono)]"
              />
            </SettingsSection>

            <SettingsSection
              label={t.modelIds}
              hint={t.modelIdsHint}
              htmlFor="custom-provider-models"
            >
              <Input
                id="custom-provider-models"
                value={customModels}
                onChange={(e) => setCustomModels(e.target.value)}
                placeholder="model-a, model-b"
                className="w-full font-[family-name:var(--font-mono)]"
              />
            </SettingsSection>

            <div className="flex flex-wrap justify-end gap-[var(--space-2)]">
              <Button variant="outline" size="sm" onClick={() => setAddingCustom(false)}>
                {t.cancel}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddCustom}
                disabled={!customId.trim() || !customName.trim() || !customBaseURL.trim()}
              >
                {t.addProvider}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setAddingCustom(true)}>
          <Icon icon="solar:add-circle-outline" width={13} />
          {t.addCustomProvider}
        </Button>
      )}
    </div>
  );
}

// ─── Provider card (preset) ──────────────────────────────────

function ProviderCard({
  icon,
  name,
  hint,
  docsUrl,
  apiKey,
  keyPlaceholder,
  isConfigured,
  isEnabled,
  onApiKeyChange,
  onToggle,
}: {
  icon: string;
  name: string;
  hint: string;
  docsUrl: string;
  apiKey: string;
  keyPlaceholder: string;
  isConfigured: boolean;
  isEnabled: boolean;
  onApiKeyChange: (key: string) => void;
  onToggle: () => void;
}) {
  const t = useT();

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex min-w-0 flex-col gap-[var(--space-3)] p-[var(--padding-card)]">
        {/* Header row */}
        <div className="flex min-w-0 items-center justify-between gap-[var(--space-3)]">
          <div className="flex min-w-0 items-center gap-[var(--space-3)]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--border-subtle)]">
              <Icon icon={icon} width={16} className="text-[var(--ink-secondary)]" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[var(--text-body-sm)] font-medium text-[var(--ink)]">
                {name}
              </div>
              <div className="truncate text-[var(--text-caption)] text-[var(--ink-tertiary)]">
                {hint}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-[var(--space-3)]">
            {isConfigured && (
              <span className="text-[var(--text-micro)] text-[var(--success)]">{t.configured}</span>
            )}
            <Switch checked={isEnabled} onChange={onToggle} aria-label={`Toggle ${name}`} />
          </div>
        </div>

        {/* API key input */}
        <div className="flex min-w-0 items-center gap-[var(--space-2)]">
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder={keyPlaceholder}
            onFocus={(e) => {
              if ((e.target as HTMLInputElement).value.includes("****")) onApiKeyChange("");
            }}
            className="w-full font-[family-name:var(--font-mono)]"
          />
          <button
            type="button"
            onClick={() => openUrl(docsUrl)}
            className="inline-flex shrink-0 items-center gap-[var(--space-1)] whitespace-nowrap text-[var(--text-caption)] text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
          >
            <span>{t.getKey}</span>
            <Icon icon="solar:arrow-right-outline" width={10} />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
