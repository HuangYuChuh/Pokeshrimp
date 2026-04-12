"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  X,
  KeyRound,
  Brain,
  Puzzle,
  Wrench,
  Zap,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type McpServerConfig,
  type HookEntryConfig,
  type PermissionConfig,
} from "@/components/settings-sections";
import { AccountsTab } from "@/components/settings/accounts-tab";
import { ModelsTab } from "@/components/settings/models-tab";
import { SkillsTab } from "@/components/settings/skills-tab";
import { ToolsTab } from "@/components/settings/tools-tab";
import { AutomationTab } from "@/components/settings/automation-tab";
import { AppearanceTab } from "@/components/settings/appearance-tab";

/* ---------------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------------- */

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  initialTab?: SettingsTabId;
}

interface SettingsData {
  defaultModel: string;
  apiKeys: { anthropic: string; openai: string };
  envKeys?: { anthropic: boolean; openai: boolean };
  mcpServers?: Record<string, McpServerConfig>;
  hooks?: Record<string, HookEntryConfig[]>;
  permissions?: PermissionConfig;
  conventionHooks?: string[];
}

/* ---------------------------------------------------------------------------
 * Navigation config
 * --------------------------------------------------------------------------- */

type SettingsTabId =
  | "accounts"
  | "models"
  | "skills"
  | "tools"
  | "automation"
  | "appearance";

const NAV_ITEMS: { id: SettingsTabId; label: string; icon: typeof KeyRound }[] = [
  { id: "accounts", label: "Accounts", icon: KeyRound },
  { id: "models", label: "Models", icon: Brain },
  { id: "skills", label: "Skills", icon: Puzzle },
  { id: "tools", label: "Tools & Integrations", icon: Wrench },
  { id: "automation", label: "Automation", icon: Zap },
  { id: "appearance", label: "Appearance", icon: Palette },
];

/* ---------------------------------------------------------------------------
 * Component
 * --------------------------------------------------------------------------- */

export type { SettingsTabId };

export function SettingsDialog({ open, onClose, initialTab }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab ?? "accounts");
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState("claude-sonnet");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [oauthConnected, setOauthConnected] = useState(false);
  const [theme, setThemeState] = useState<"dark" | "light" | "system">("dark");
  const [mcpServers, setMcpServers] = useState<Record<string, McpServerConfig>>({});
  const [hooks, setHooks] = useState<Record<string, HookEntryConfig[]>>({});
  const [permissions, setPermissions] = useState<PermissionConfig>({
    alwaysAllow: [],
    alwaysDeny: [],
    alwaysAsk: [],
  });
  const [conventionHooks, setConventionHooks] = useState<string[]>([]);

  const isElectron = typeof window !== "undefined" && !!window.pokeshrimp?.auth;

  // Reset active tab when initialTab changes or dialog opens
  useEffect(() => {
    if (open && initialTab) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("pokeshrimp-theme") as
      | "dark"
      | "light"
      | "system"
      | null;
    if (stored) setThemeState(stored);
  }, []);

  const handleThemeChange = useCallback(
    (value: "dark" | "light" | "system") => {
      setThemeState(value);
      localStorage.setItem("pokeshrimp-theme", value);
      const root = document.documentElement;
      if (value === "system") {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        root.classList.toggle("dark", prefersDark);
      } else {
        root.classList.toggle("dark", value === "dark");
      }
    },
    [],
  );

  // Check if a stored OAuth token exists and is valid
  useEffect(() => {
    if (!open || !isElectron) return;
    window.pokeshrimp?.auth
      ?.getValidToken?.()
      .then((token) => {
        setOauthConnected(!!token);
      })
      .catch(() => {
        setOauthConnected(false);
      });
  }, [open, isElectron]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: SettingsData) => {
        setSettings(data);
        setAnthropicKey(data.apiKeys?.anthropic ?? "");
        setOpenaiKey(data.apiKeys?.openai ?? "");
        setDefaultModel(data.defaultModel ?? "claude-sonnet");
        setMcpServers(data.mcpServers ?? {});
        setHooks(data.hooks ?? {});
        setPermissions(
          data.permissions ?? { alwaysAllow: [], alwaysDeny: [], alwaysAsk: [] },
        );
        setConventionHooks(data.conventionHooks ?? []);
      })
      .catch(() => {});
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultModel,
          apiKeys: {
            anthropic: anthropicKey.includes("****") ? undefined : anthropicKey,
            openai: openaiKey.includes("****") ? undefined : openaiKey,
          },
          mcpServers,
          hooks,
          permissions,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }, [defaultModel, anthropicKey, openaiKey, mcpServers, hooks, permissions]);

  const handleOauthAutoSave = useCallback(
    async (openaiToken: string) => {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultModel,
          apiKeys: {
            anthropic: anthropicKey.includes("****") ? undefined : anthropicKey,
            openai: openaiToken,
          },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    [defaultModel, anthropicKey],
  );

  if (!open) return null;

  return (
    <div
      className="nodrag fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[80vh] w-[720px] flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 pt-5">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">
              Settings
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
          >
            <X size={15} strokeWidth={1.5} />
          </Button>
        </div>

        <Separator />

        {/* Body: sidebar + content */}
        <div className="flex min-h-0 flex-1">
          {/* Sidebar */}
          <nav className="w-[180px] shrink-0 border-r border-border py-3">
            <div className="space-y-0.5 px-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors",
                      isActive
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    <Icon size={15} strokeWidth={1.5} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {!settings ? (
              <div className="space-y-5">
                <Skeleton className="h-[60px] w-full rounded-lg" />
                <Skeleton className="h-[60px] w-full rounded-lg" />
                <Skeleton className="h-[80px] w-full rounded-lg" />
              </div>
            ) : (
              <>
                {activeTab === "accounts" && (
                  <AccountsTab
                    anthropicKey={anthropicKey}
                    openaiKey={openaiKey}
                    onAnthropicKeyChange={setAnthropicKey}
                    onOpenaiKeyChange={setOpenaiKey}
                    envKeys={settings.envKeys}
                    apiKeys={settings.apiKeys}
                    defaultModel={defaultModel}
                    oauthConnected={oauthConnected}
                    onOauthConnected={setOauthConnected}
                    onAutoSave={handleOauthAutoSave}
                  />
                )}
                {activeTab === "models" && (
                  <ModelsTab
                    defaultModel={defaultModel}
                    onDefaultModelChange={setDefaultModel}
                  />
                )}
                {activeTab === "skills" && (
                  <SkillsTab active={activeTab === "skills"} />
                )}
                {activeTab === "tools" && (
                  <ToolsTab
                    active={activeTab === "tools"}
                    mcpServers={mcpServers}
                    onMcpServersChange={setMcpServers}
                  />
                )}
                {activeTab === "automation" && (
                  <AutomationTab
                    hooks={hooks}
                    conventionHooks={conventionHooks}
                    onHooksChange={setHooks}
                    permissions={permissions}
                    onPermissionsChange={setPermissions}
                  />
                )}
                {activeTab === "appearance" && (
                  <AppearanceTab
                    theme={theme}
                    onThemeChange={handleThemeChange}
                  />
                )}
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-[11px] text-muted-foreground/60">
            Saved to ~/.visagent/config.json
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saved ? "Saved!" : saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
