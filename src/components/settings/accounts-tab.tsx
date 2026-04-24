"use client";

import { useCallback, useId, useState, type ReactNode } from "react";
import { Button, Input } from "@/design-system/components";
import { SettingsSection, SettingsTabHeader } from "@/components/settings-sections";
import { Icon } from "@iconify/react";
import { useT } from "@/lib/i18n";

interface AccountsTabProps {
  anthropicKey: string;
  openaiKey: string;
  onAnthropicKeyChange: (key: string) => void;
  onOpenaiKeyChange: (key: string) => void;
  envKeys?: { anthropic: boolean; openai: boolean };
  apiKeys?: { anthropic: string; openai: string };
  oauthConnected: boolean;
  onOauthConnected: (connected: boolean) => void;
  onAutoSave: (openaiToken: string) => void;
}

function openKeyUrl(url: string) {
  if (window.pokeshrimp?.auth?.openBrowser) {
    window.pokeshrimp.auth.openBrowser(url);
  } else {
    window.open(url, "_blank");
  }
}

export function AccountsTab({
  anthropicKey,
  openaiKey,
  onAnthropicKeyChange,
  onOpenaiKeyChange,
  envKeys,
  apiKeys,
  oauthConnected,
  onOauthConnected,
  onAutoSave,
}: AccountsTabProps) {
  const t = useT();
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const anthropicInputId = useId();
  const openaiInputId = useId();
  const isElectron = typeof window !== "undefined" && !!window.pokeshrimp?.auth;

  const handleOpenAIOAuth = useCallback(async () => {
    if (!window.pokeshrimp?.auth) return;
    setOauthLoading(true);
    setOauthError(null);
    try {
      const { accessToken } = await window.pokeshrimp.auth.openaiOAuth!();
      onOpenaiKeyChange(accessToken);
      onOauthConnected(true);
      onAutoSave(accessToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : "OAuth failed";
      if (!message.includes("User closed")) setOauthError(message);
    } finally {
      setOauthLoading(false);
    }
  }, [onAutoSave, onOauthConnected, onOpenaiKeyChange]);

  return (
    <div className="flex min-w-0 flex-col gap-[var(--space-8)]">
      <SettingsTabHeader title={t.accounts} description={t.accountsDescription} />

      <div className="flex min-w-0 flex-col gap-[var(--space-8)]">
        <FieldGroup
          label={t.anthropic}
          hint={t.anthropicHint}
          inputId={anthropicInputId}
          getKeyUrl="https://console.anthropic.com/settings/keys"
        >
          <Input
            id={anthropicInputId}
            type="password"
            value={anthropicKey}
            onChange={(e) => onAnthropicKeyChange(e.target.value)}
            placeholder="sk-ant-..."
            onFocus={(e) => {
              if ((e.target as HTMLInputElement).value.includes("****")) onAnthropicKeyChange("");
            }}
            className="w-full font-[var(--font-mono)]"
          />
          <EnvHint
            env={envKeys?.anthropic}
            config={!!apiKeys?.anthropic}
            name="ANTHROPIC_API_KEY"
          />
        </FieldGroup>

        <FieldGroup
          label={t.openai}
          hint={t.openaiHint}
          inputId={openaiInputId}
          getKeyUrl="https://platform.openai.com/api-keys"
        >
          <div className="flex min-w-0 gap-[var(--space-2)] max-[620px]:flex-col">
            <Input
              id={openaiInputId}
              type="password"
              value={openaiKey}
              onChange={(e) => onOpenaiKeyChange(e.target.value)}
              placeholder="sk-..."
              onFocus={(e) => {
                if ((e.target as HTMLInputElement).value.includes("****")) onOpenaiKeyChange("");
              }}
              className="w-full font-[var(--font-mono)]"
            />
            {isElectron ? (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 max-[620px]:w-full"
                disabled={oauthLoading}
                onClick={handleOpenAIOAuth}
              >
                {oauthLoading ? t.connecting : t.loginWithOpenAI}
              </Button>
            ) : null}
          </div>
          {oauthConnected && !oauthError ? (
            <p
              className="text-[var(--text-caption)] text-[var(--success)]"
              role="status"
              aria-live="polite"
            >
              {t.oauthConnected}
            </p>
          ) : null}
          {oauthError ? (
            <p
              className="text-[var(--text-caption)] text-[var(--error)]"
              role="alert"
              aria-live="assertive"
            >
              {oauthError}
            </p>
          ) : null}
          <EnvHint env={envKeys?.openai} config={!!apiKeys?.openai} name="OPENAI_API_KEY" />
        </FieldGroup>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  hint,
  inputId,
  getKeyUrl,
  children,
}: {
  label: string;
  hint?: string;
  inputId: string;
  getKeyUrl?: string;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <SettingsSection
      label={label}
      hint={hint}
      htmlFor={inputId}
      action={
        getKeyUrl ? (
          <button
            type="button"
            onClick={() => openKeyUrl(getKeyUrl)}
            className="inline-flex items-center gap-[var(--space-1)] text-[var(--text-caption)] text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
          >
            <span>{t.getKey}</span>
            <Icon icon="solar:arrow-right-outline" width={10} className="shrink-0" />
          </button>
        ) : null
      }
    >
      <div className="flex min-w-0 flex-col gap-[var(--space-2)]">{children}</div>
    </SettingsSection>
  );
}

function EnvHint({ env, config, name }: { env?: boolean; config: boolean; name: string }) {
  const t = useT();
  if (!env) return null;

  return (
    <p className="text-[var(--text-caption)] leading-[var(--leading-normal)] text-[var(--ink-tertiary)]">
      {config ? (
        <>
          {t.envKeyPriority} <span className="font-[var(--font-mono)]">{name}</span>
        </>
      ) : (
        <>
          {t.usingEnvVar.split("{name}")[0]}
          <span className="font-[var(--font-mono)]">{name}</span>
          {t.usingEnvVar.split("{name}")[1]}
        </>
      )}
    </p>
  );
}
