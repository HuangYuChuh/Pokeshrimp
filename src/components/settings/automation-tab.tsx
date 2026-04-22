"use client";

import { Icon } from "@iconify/react";
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
    <div className="space-y-6">
      <div className="flex items-center gap-[var(--gap-inline)]">
        <Icon icon="solar:bolt-outline" width={18} className="text-[var(--ink-secondary)]" />
        <h3 className="text-[var(--text-headline)] font-semibold text-[var(--ink)]">Automation</h3>
      </div>

      <HooksSection hooks={hooks} conventionHooks={conventionHooks} onChange={onHooksChange} />

      <PermissionsSection permissions={permissions} onChange={onPermissionsChange} />
    </div>
  );
}
