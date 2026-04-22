"use client";

import { useState, useCallback } from "react";
import { Button, Input } from "@/design-system/components";
import { Icon } from "@iconify/react";

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
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

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
      if (!message.includes("User closed")) {
        setOauthError(message);
      }
    } finally {
      setOauthLoading(false);
    }
  }, [onOpenaiKeyChange, onOauthConnected, onAutoSave]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-[var(--gap-inline)]">
        <Icon icon="solar:key-outline" width={18} className="text-[var(--ink-secondary)]" />
        <h3 className="text-[var(--text-headline)] font-semibold text-[var(--ink)]">Accounts</h3>
      </div>

      <Field
        label="Anthropic API Key"
        hint="Required for Claude models"
        getKeyUrl="https://console.anthropic.com/settings/keys"
      >
        <Input
          type="password"
          value={anthropicKey}
          onChange={(e) => onAnthropicKeyChange(e.target.value)}
          placeholder="sk-ant-..."
          onFocus={(e) => {
            if ((e.target as HTMLInputElement).value.includes("****")) onAnthropicKeyChange("");
          }}
          className="w-full font-[var(--font-mono)]"
        />
        <EnvKeyHint
          envAvailable={envKeys?.anthropic}
          hasConfigKey={!!apiKeys?.anthropic}
          envVarName="ANTHROPIC_API_KEY"
        />
      </Field>

      <Field
        label="OpenAI API Key"
        hint="Required for GPT models"
        getKeyUrl="https://platform.openai.com/api-keys"
      >
        <div className="flex gap-[var(--gap-inline)]">
          <Input
            type="password"
            value={openaiKey}
            onChange={(e) => onOpenaiKeyChange(e.target.value)}
            placeholder="sk-..."
            onFocus={(e) => {
              if ((e.target as HTMLInputElement).value.includes("****")) onOpenaiKeyChange("");
            }}
            className="w-full font-[var(--font-mono)]"
          />
          {isElectron && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={oauthLoading}
              onClick={handleOpenAIOAuth}
            >
              {oauthLoading ? "Logging in..." : "Login with OpenAI"}
            </Button>
          )}
        </div>
        {oauthConnected && !oauthError && (
          <p className="mt-1 text-[var(--text-micro)] text-[var(--success)]">
            OpenAI OAuth connected (token auto-refreshes)
          </p>
        )}
        {oauthError && (
          <p className="mt-1 text-[var(--text-micro)] text-[var(--error)]">{oauthError}</p>
        )}
        <EnvKeyHint
          envAvailable={envKeys?.openai}
          hasConfigKey={!!apiKeys?.openai}
          envVarName="OPENAI_API_KEY"
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  hint,
  getKeyUrl,
  children,
}: {
  label: string;
  hint?: string;
  getKeyUrl?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-[var(--text-body-sm)] font-medium text-[var(--ink)]">{label}</label>
        {getKeyUrl && (
          <Button variant="ghost" size="sm" onClick={() => openKeyUrl(getKeyUrl)}>
            Get key
            <Icon icon="solar:arrow-right-outline" width={12} />
          </Button>
        )}
      </div>
      {hint && (
        <p className="mb-2 text-[var(--text-caption)] text-[var(--ink-secondary)]">{hint}</p>
      )}
      {children}
    </div>
  );
}

function EnvKeyHint({
  envAvailable,
  hasConfigKey,
  envVarName,
}: {
  envAvailable?: boolean;
  hasConfigKey: boolean;
  envVarName: string;
}) {
  if (!envAvailable) return null;
  if (hasConfigKey) {
    return (
      <p className="mt-1.5 text-[var(--text-micro)] text-[var(--ink-secondary)]">
        Config key takes priority over env var
      </p>
    );
  }
  return (
    <p className="mt-1.5 text-[var(--text-micro)] text-[var(--success)]">
      Using {envVarName} from environment
    </p>
  );
}
