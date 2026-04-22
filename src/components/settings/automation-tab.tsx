"use client";

import {
  HooksSection,
  PermissionsSection,
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
    <div>
      <h3 className="text-[var(--text-headline)] font-semibold text-[var(--ink)]">Automation</h3>
      <p className="mt-1 text-[var(--text-body-sm)] text-[var(--ink-tertiary)]">
        Hook scripts and command permission rules.
      </p>

      <div className="mt-8 space-y-6">
        <HooksSection hooks={hooks} conventionHooks={conventionHooks} onChange={onHooksChange} />
        <PermissionsSection permissions={permissions} onChange={onPermissionsChange} />
      </div>
    </div>
  );
}
