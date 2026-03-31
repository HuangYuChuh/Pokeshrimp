// Re-export session types from core
export type { Session, Message, ToolCall } from "@/core/session/types";

// Re-export tool types from core
export type { Tool, ToolContext, ToolResult } from "@/core/tool/types";

// ─── MCP ─────────────────────────────────────────────────────────

export type MCPTransport = "stdio" | "http";

export interface MCPServerConfig {
  name: string;
  transport: MCPTransport;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverName: string;
}

// ─── Skill ───────────────────────────────────────────────────────

export interface Skill {
  name: string;
  slug: string;
  description: string;
  requiredTools: string[];
  scope: "global" | "project";
  filePath: string;
}

// ─── Asset Descriptor ────────────────────────────────────────────

export interface AssetDescriptor {
  type: "image" | "video" | "svg" | "file";
  path: string;
  mimeType: string;
  metadata?: Record<string, unknown>;
}

// ─── API payloads ────────────────────────────────────────────────

export interface ChatRequestBody {
  messages: { role: string; content: string }[];
  modelId?: string;
  sessionId?: string;
}
