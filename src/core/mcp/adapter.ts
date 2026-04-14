import { z } from "zod";
import type { Tool, ToolContext, ToolResult, PermissionResult } from "@/core/tool/types";
import type { MCPClientManager, MCPServerTools } from "./client";
import type { ToolRegistry } from "@/core/tool/registry";

type MCPToolInfo = MCPServerTools["tools"][number];

export function createMCPTool(
  serverName: string,
  mcpToolInfo: MCPToolInfo,
  clientManager: MCPClientManager,
): Tool {
  return {
    name: mcpToolInfo.name,
    description: mcpToolInfo.description ?? "",
    inputSchema: z.any(),
    isMcp: true,
    serverName,

    isReadOnly(): boolean {
      return false;
    },

    async checkPermissions(_input: unknown, _context: ToolContext): Promise<PermissionResult> {
      return { behavior: "ask" };
    },

    async call(input: unknown, _context: ToolContext): Promise<ToolResult> {
      try {
        const result = await clientManager.callTool(
          serverName,
          mcpToolInfo.name,
          input as Record<string, unknown>,
        );
        return { success: true, data: result };
      } catch (err) {
        return {
          success: false,
          data: null,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    },
  };
}

export async function registerMCPTools(
  clientManager: MCPClientManager,
  registry: ToolRegistry,
): Promise<void> {
  const serverToolsList = await clientManager.listAllTools();
  for (const { serverName, tools } of serverToolsList) {
    for (const toolInfo of tools) {
      const tool = createMCPTool(serverName, toolInfo, clientManager);
      registry.registerTool(tool);
    }
  }
}
