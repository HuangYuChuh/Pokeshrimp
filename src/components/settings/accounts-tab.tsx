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
      if (!message.includes("User closed")) setOauthError(message);
    } finally {
      setOauthLoading(false);
    }
  }, [onOpenaiKeyChange, onOauthConnected, onAutoSave]);

  return (
    <div>
      <h3 className="text-[var(--text-headline)] font-semibold text-[var(--ink)]">Accounts</h3>
      <p className="mt-1 text-[var(--text-body-sm)] text-[var(--ink-tertiary)]">
        API keys for connecting to LLM providers.
      </p>

      <div className="mt-8 space-y-8">
        {/* Anthropic */}
        <FieldGroup
          label="Anthropic"
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
          <EnvHint
            env={envKeys?.anthropic}
            config={!!apiKeys?.anthropic}
            name="ANTHROPIC_API_KEY"
          />
        </FieldGroup>

        {/* OpenAI */}
        <FieldGroup
          label="OpenAI"
          hint="Required for GPT models"
          getKeyUrl="https://platform.openai.com/api-keys"
        >
          <div className="flex gap-[var(--space-2)]">
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
                {oauthLoading ? "Connecting..." : "Login with OpenAI"}
              </Button>
            )}
          </div>
          {oauthConnected && !oauthError && (
            <p className="mt-2 text-[var(--text-caption)] text-[var(--success)]">
              Connected — token auto-refreshes
            </p>
          )}
          {oauthError && (
            <p className="mt-2 text-[var(--text-caption)] text-[var(--error)]">{oauthError}</p>
          )}
          <EnvHint env={envKeys?.openai} config={!!apiKeys?.openai} name="OPENAI_API_KEY" />
        </FieldGroup>
      </div>
    </div>
  );
}

/* ─── Field group ── */

function FieldGroup({
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
      <div className="flex items-center justify-between mb-2">
        <div>
          <label className="text-[var(--text-title)] font-medium text-[var(--ink)]">{label}</label>
          {hint && (
            <p className="mt-0.5 text-[var(--text-caption)] text-[var(--ink-tertiary)]">{hint}</p>
          )}
        </div>
        {getKeyUrl && (
          <button
            type="button"
            onClick={() => openKeyUrl(getKeyUrl)}
            className="text-[var(--text-caption)] text-[var(--accent)] hover:underline"
          >
            Get key{" "}
            <Icon
              icon="solar:arrow-right-outline"
              width={10}
              className="inline ml-[var(--space-1)]"
            />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─── Env hint ── */

function EnvHint({ env, config, name }: { env?: boolean; config: boolean; name: string }) {
  if (!env) return null;
  return (
    <p className="mt-2 text-[var(--text-caption)] text-[var(--ink-tertiary)]">
      {config ? "Config key takes priority over env" : `Using ${name} from environment`}
    </p>
  );
}
