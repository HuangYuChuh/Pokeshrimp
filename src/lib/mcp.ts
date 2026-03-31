// Re-export from core — keeps existing imports working
import { MCPClientManager } from "@/core/mcp/client";
import type { MCPServerConnectConfig } from "@/core/mcp/client";
import { getConfig } from "@/core/config/loader";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";

export type { MCPServerConnectConfig as MCPServerConfig } from "@/core/mcp/client";

const manager = new MCPClientManager();

export async function connectMCPServer(
  name: string,
  config: MCPServerConnectConfig,
): Promise<Client> {
  return manager.connectServer(name, config);
}

export async function getAllMCPTools(): Promise<
  Array<{ serverName: string; tools: Awaited<ReturnType<Client["listTools"]>>["tools"] }>
> {
  // Auto-connect from config before listing
  const config = getConfig();
  for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
    if (serverConfig.enabled !== false) {
      try {
        await manager.connectServer(name, {
          command: serverConfig.command,
          args: serverConfig.args,
          env: serverConfig.env,
        });
      } catch (err) {
        console.error(`[MCP] Failed to connect to ${name}:`, err);
      }
    }
  }
  return manager.listAllTools();
}

export async function callMCPTool(
  serverName: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  return manager.callTool(serverName, toolName, args);
}

export async function disconnectAll(): Promise<void> {
  return manager.disconnectAll();
}
