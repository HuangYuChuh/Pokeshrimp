"use client";

import {
  McpServersSection,
  SettingsSection,
  SettingsTabHeader,
  type McpServerConfig,
} from "@/components/settings-sections";
import { ToolStatusList } from "@/components/tool-status";

interface ToolsTabProps {
  active: boolean;
  mcpServers: Record<string, McpServerConfig>;
  onMcpServersChange: (servers: Record<string, McpServerConfig>) => void;
}

export function ToolsTab({ active, mcpServers, onMcpServersChange }: ToolsTabProps) {
  return (
    <div className="flex min-w-0 flex-col gap-[var(--space-6)]">
      <SettingsTabHeader
        title="Tools & Integrations"
        description="CLI tools and MCP server connections."
      />

      <SettingsSection label="CLI Tools">
        <ToolStatusList open={active} />
      </SettingsSection>

      <McpServersSection servers={mcpServers} onChange={onMcpServersChange} />
    </div>
  );
}
