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
    <div className="space-y-5">
      <h3 className="text-[15px] font-semibold mb-4">Automation</h3>

      <HooksSection hooks={hooks} conventionHooks={conventionHooks} onChange={onHooksChange} />

      <PermissionsSection permissions={permissions} onChange={onPermissionsChange} />
    </div>
  );
}
