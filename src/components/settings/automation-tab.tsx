"use client";

import {
  HooksSection,
  PermissionsSection,
  SettingsTabHeader,
  type HookEntryConfig,
  type PermissionConfig,
} from "@/components/settings-sections";

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
  return (
    <div className="flex min-w-0 flex-col gap-[var(--space-6)]">
      <SettingsTabHeader
        title="Automation"
        description="Hook scripts and command permission rules."
      />

      <HooksSection hooks={hooks} conventionHooks={conventionHooks} onChange={onHooksChange} />
      <PermissionsSection permissions={permissions} onChange={onPermissionsChange} />
    </div>
  );
}
