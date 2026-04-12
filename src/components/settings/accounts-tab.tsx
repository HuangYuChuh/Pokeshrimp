"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface AccountsTabProps {
  anthropicKey: string;
  openaiKey: string;
  onAnthropicKeyChange: (key: string) => void;
  onOpenaiKeyChange: (key: string) => void;
  envKeys?: { anthropic: boolean; openai: boolean };
  apiKeys?: { anthropic: string; openai: string };
  defaultModel: string;
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
    <div className="space-y-5">
      <h3 className="text-[15px] font-semibold mb-4">Accounts</h3>

      <Field
        label="Anthropic API Key"
        hint="Required for Claude models"
        getKeyUrl="https://console.anthropic.com/settings/keys"
      >
        <input
          type="password"
          value={anthropicKey}
          onChange={(e) => onAnthropicKeyChange(e.target.value)}
          placeholder="sk-ant-..."
          onFocus={(e) => {
            if (e.target.value.includes("****")) onAnthropicKeyChange("");
          }}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
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
        <div className="flex gap-2">
          <input
            type="password"
            value={openaiKey}
            onChange={(e) => onOpenaiKeyChange(e.target.value)}
            placeholder="sk-..."
            onFocus={(e) => {
              if (e.target.value.includes("****")) onOpenaiKeyChange("");
            }}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
          />
          {isElectron && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 text-[12px]"
              disabled={oauthLoading}
              onClick={handleOpenAIOAuth}
            >
              {oauthLoading ? "Logging in..." : "Login with OpenAI"}
            </Button>
          )}
        </div>
        {oauthConnected && !oauthError && (
          <p className="mt-1 text-[11px] text-green-400">
            OpenAI OAuth connected (token auto-refreshes)
          </p>
        )}
        {oauthError && (
          <p className="mt-1 text-[11px] text-destructive">
            {oauthError}
          </p>
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
        <label className="text-[13px] font-medium text-foreground">
          {label}
        </label>
        {getKeyUrl && (
          <button
            type="button"
            onClick={() => openKeyUrl(getKeyUrl)}
            className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Get key &rarr;
          </button>
        )}
      </div>
      {hint && (
        <p className="mb-2 text-[12px] text-muted-foreground">{hint}</p>
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
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Config key takes priority over env var
      </p>
    );
  }
  return (
    <p className="mt-1.5 text-[11px] text-green-400">
      Using {envVarName} from environment
    </p>
  );
}
