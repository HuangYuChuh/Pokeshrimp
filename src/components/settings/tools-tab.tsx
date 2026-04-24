"use client";

import {
  McpServersSection,
  SettingsSection,
  SettingsTabHeader,
  type McpServerConfig,
} from "@/components/settings-sections";
import { ToolStatusList } from "@/components/tool-status";
import { useT } from "@/lib/i18n";

interface ToolsTabProps {
  active: boolean;
  mcpServers: Record<string, McpServerConfig>;
  onMcpServersChange: (servers: Record<string, McpServerConfig>) => void;
}

export function ToolsTab({ active, mcpServers, onMcpServersChange }: ToolsTabProps) {
  const t = useT();
  return (
    <div className="flex min-w-0 flex-col gap-[var(--space-6)]">
      <SettingsTabHeader title={t.tools} description={t.toolsDescription} />

      <SettingsSection label={t.cliTools}>
        <ToolStatusList open={active} />
      </SettingsSection>

      <McpServersSection servers={mcpServers} onChange={onMcpServersChange} />
    </div>
  );
}
