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
