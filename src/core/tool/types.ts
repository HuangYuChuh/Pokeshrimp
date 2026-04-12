import { z } from "zod";
import type { LanguageModel } from "ai";
import type { ApprovalChannel } from "@/core/permission/approval";

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
  /**
   * Channel for interactive command approval. Set by the API layer
   * inside createDataStreamResponse's execute callback so the
   * CommandApprovalMiddleware can prompt the user and await a decision.
   * Absent in CLI mode or when the caller opts out of interactive approval.
   */
  approvalChannel?: ApprovalChannel;
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

