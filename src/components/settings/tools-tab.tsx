"use client";

import { ToolStatusList } from "@/components/tool-status";
import {
  McpServersSection,
  type McpServerConfig,
} from "@/components/settings-sections";

interface ToolsTabProps {
  active: boolean;
  mcpServers: Record<string, McpServerConfig>;
  onMcpServersChange: (servers: Record<string, McpServerConfig>) => void;
}

export function ToolsTab({ active, mcpServers, onMcpServersChange }: ToolsTabProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-[15px] font-semibold mb-4">Tools & Integrations</h3>

      <div>
        <label className="mb-2 block text-[13px] font-medium text-foreground">
          CLI Tools
        </label>
        <ToolStatusList open={active} />
      </div>

      <McpServersSection
        servers={mcpServers}
        onChange={onMcpServersChange}
      />
    </div>
  );
}
