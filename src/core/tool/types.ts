import { z } from "zod";

export interface ToolContext {
  sessionId?: string;
  cwd: string;
  signal?: AbortSignal;
}

export interface ToolResult {
  success: boolean;
  data: unknown;
  error?: string;
}

export type PermissionBehavior = "allow" | "deny" | "ask";

export interface PermissionResult {
  behavior: PermissionBehavior;
  message?: string;
  updatedInput?: unknown;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: z.ZodType;

  isReadOnly(): boolean;
  isDestructive?(): boolean;
  isConcurrencySafe?(): boolean;

  checkPermissions(
    input: unknown,
    context: ToolContext,
  ): Promise<PermissionResult>;
  call(input: unknown, context: ToolContext): Promise<ToolResult>;

  userFacingName?(input?: unknown): string;

  isMcp?: boolean;
  isBuiltin?: boolean;
  serverName?: string;
}

export interface ToolExecutionHooks {
  onPreToolUse?(
    toolName: string,
    input: unknown,
  ): Promise<{ allow: boolean; updatedInput?: unknown }>;
  onPostToolUse?(
    toolName: string,
    input: unknown,
    result: ToolResult,
  ): Promise<void>;
  onPostToolUseFailure?(
    toolName: string,
    input: unknown,
    error: Error,
  ): Promise<void>;
}
