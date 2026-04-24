"use client";

import {
  HooksSection,
  PermissionsSection,
  SettingsTabHeader,
  type HookEntryConfig,
  type PermissionConfig,
} from "@/components/settings-sections";
import { useT } from "@/lib/i18n";

interface AutomationTabProps {
  hooks: Record<string, HookEntryConfig[]>;
  conventionHooks: string[];
  onHooksChange: (hooks: Record<string, HookEntryConfig[]>) => void;
  permissions: PermissionConfig;
  onPermissionsChange: (permissions: PermissionConfig) => void;
}

export function AutomationTab({
  hooks,
  conventionHooks,
  onHooksChange,
  permissions,
  onPermissionsChange,
}: AutomationTabProps) {
  const t = useT();
  return (
    <div className="flex min-w-0 flex-col gap-[var(--space-6)]">
      <SettingsTabHeader title={t.automation} description={t.automationDescription} />

      <HooksSection hooks={hooks} conventionHooks={conventionHooks} onChange={onHooksChange} />
      <PermissionsSection permissions={permissions} onChange={onPermissionsChange} />
    </div>
  );
}
