import { z } from "zod";
import type { LanguageModel } from "ai";

export interface ToolContext {
  sessionId?: string;
  cwd: string;
  signal?: AbortSignal;
  /**
   * The language model in use for the current run().
   * Populated by AgentRuntime so tools that need to start an LLM
   * call (e.g. spawn_agent) can reuse the same model as the parent.
   */
  model?: LanguageModel;
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
