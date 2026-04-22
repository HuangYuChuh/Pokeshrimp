"use client";

import { Icon } from "@iconify/react";
import { ToolStatusList } from "@/components/tool-status";
import { McpServersSection, type McpServerConfig } from "@/components/settings-sections";

interface ToolsTabProps {
  active: boolean;
  mcpServers: Record<string, McpServerConfig>;
  onMcpServersChange: (servers: Record<string, McpServerConfig>) => void;
}

export function ToolsTab({ active, mcpServers, onMcpServersChange }: ToolsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-[var(--gap-inline)]">
        <Icon icon="solar:wrench-outline" width={18} className="text-[var(--ink-secondary)]" />
        <h3 className="text-[var(--text-headline)] font-semibold text-[var(--ink)]">
          Tools & Integrations
        </h3>
      </div>

      <div>
        <label className="mb-2 block text-[var(--text-body-sm)] font-medium text-[var(--ink)]">
          CLI Tools
        </label>
        <ToolStatusList open={active} />
      </div>

      <McpServersSection servers={mcpServers} onChange={onMcpServersChange} />
    </div>
  );
}
