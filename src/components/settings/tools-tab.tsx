"use client";

import { ToolStatusList } from "@/components/tool-status";
import { McpServersSection, type McpServerConfig } from "@/components/settings-sections";

interface ToolsTabProps {
  active: boolean;
  mcpServers: Record<string, McpServerConfig>;
  onMcpServersChange: (servers: Record<string, McpServerConfig>) => void;
}

export function ToolsTab({ active, mcpServers, onMcpServersChange }: ToolsTabProps) {
  return (
    <div>
      <h3 className="text-[var(--text-headline)] font-semibold text-[var(--ink)]">
        Tools & Integrations
      </h3>
      <p className="mt-1 text-[var(--text-body-sm)] text-[var(--ink-tertiary)]">
        CLI tools and MCP server connections.
      </p>

      <div className="mt-8 space-y-8">
        <div>
          <label className="block text-[var(--text-title)] font-medium text-[var(--ink)] mb-3">
            CLI Tools
          </label>
          <ToolStatusList open={active} />
        </div>

        <McpServersSection servers={mcpServers} onChange={onMcpServersChange} />
      </div>
    </div>
  );
}
