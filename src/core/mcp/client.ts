import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface MCPServerConnectConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

type MCPToolInfo = Awaited<ReturnType<Client["listTools"]>>["tools"][number];

export interface MCPServerTools {
  serverName: string;
  tools: MCPToolInfo[];
}

export class MCPClientManager {
  private clients = new Map<string, Client>();

  async connectServer(name: string, config: MCPServerConnectConfig): Promise<Client> {
    if (this.clients.has(name)) {
      return this.clients.get(name)!;
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
    this.clients.set(name, client);
    return client;
  }

  async disconnectServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (!client) return;
    try {
      await client.close();
    } catch (err) {
      console.error(`[MCP] Failed to disconnect ${name}:`, err);
    }
    this.clients.delete(name);
  }

  async disconnectAll(): Promise<void> {
    for (const [name, client] of this.clients) {
      try {
        await client.close();
      } catch (err) {
        console.error(`[MCP] Failed to disconnect ${name}:`, err);
      }
    }
    this.clients.clear();
  }

  getClient(name: string): Client | undefined {
    return this.clients.get(name);
  }

  async listAllTools(): Promise<MCPServerTools[]> {
    const results: MCPServerTools[] = [];
    for (const [name, client] of this.clients) {
      try {
        const { tools } = await client.listTools();
        results.push({ serverName: name, tools });
      } catch (err) {
        console.error(`[MCP] Failed to list tools for ${name}:`, err);
      }
    }
    return results;
  }

  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server "${serverName}" is not connected`);
    }
    return client.callTool({ name: toolName, arguments: args });
  }

  get connectedServers(): string[] {
    return Array.from(this.clients.keys());
  }
}
