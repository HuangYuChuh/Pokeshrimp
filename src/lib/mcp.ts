import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "fs";
import path from "path";
import os from "os";

export interface MCPServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

interface MCPServersConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

const GLOBAL_MCP_CONFIG = path.join(
  os.homedir(),
  ".pokeshrimp",
  "mcp-servers.json"
);

// Active MCP clients keyed by server name
const clients = new Map<string, Client>();

function loadMCPConfig(): MCPServersConfig {
  try {
    if (fs.existsSync(GLOBAL_MCP_CONFIG)) {
      const raw = fs.readFileSync(GLOBAL_MCP_CONFIG, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // Fall back to empty
  }
  return { mcpServers: {} };
}

export async function connectMCPServer(
  name: string,
  config: MCPServerConfig
): Promise<Client> {
  // Return existing client if already connected
  if (clients.has(name)) {
    return clients.get(name)!;
  }

  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args,
    env: { ...process.env, ...config.env } as Record<string, string>,
  });

  const client = new Client({
    name: `pokeshrimp-${name}`,
    version: "0.1.0",
  });

  await client.connect(transport);
  clients.set(name, client);
  return client;
}

export async function getAllMCPTools(): Promise<
  Array<{ serverName: string; tools: Awaited<ReturnType<Client["listTools"]>>["tools"] }>
> {
  const config = loadMCPConfig();
  const results: Array<{
    serverName: string;
    tools: Awaited<ReturnType<Client["listTools"]>>["tools"];
  }> = [];

  for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
    try {
      const client = await connectMCPServer(name, serverConfig);
      const { tools } = await client.listTools();
      results.push({ serverName: name, tools });
    } catch (err) {
      console.error(`[MCP] Failed to connect to ${name}:`, err);
    }
  }

  return results;
}

export async function callMCPTool(
  serverName: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const client = clients.get(serverName);
  if (!client) {
    throw new Error(`MCP server "${serverName}" is not connected`);
  }

  const result = await client.callTool({ name: toolName, arguments: args });
  return result;
}

export async function disconnectAll(): Promise<void> {
  for (const [name, client] of clients) {
    try {
      await client.close();
    } catch (err) {
      console.error(`[MCP] Failed to disconnect ${name}:`, err);
    }
  }
  clients.clear();
}
