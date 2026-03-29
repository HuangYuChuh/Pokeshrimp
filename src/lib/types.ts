// Core type definitions for Pokeshrimp

// ─── Session & Messages ─────────────────────────────────────────

export interface Session {
  id: string;
  title: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createdAt: string;
}

export interface ToolCall {
  id: string;
  messageId: string;
  sessionId: string;
  toolName: string;
  serverName: string;
  args: string; // JSON string
  result: string | null; // JSON string
  status: "pending" | "running" | "success" | "error";
  createdAt: string;
}

// ─── MCP ─────────────────────────────────────────────────────────

export type MCPTransport = "stdio" | "http";

export interface MCPServerConfig {
  name: string;
  transport: MCPTransport;
  /** For stdio: command to run */
  command?: string;
  /** For stdio: command arguments */
  args?: string[];
  /** For http: server URL */
  url?: string;
  /** Environment variables passed to the process */
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
  slug: string; // slash command name, e.g. "vi-design"
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
