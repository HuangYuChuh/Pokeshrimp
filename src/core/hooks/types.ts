export type HookEvent =
  | "PreToolUse"
  | "PostToolUse"
  | "PostToolUseFailure"
  | "UserPromptSubmit"
  | "SessionStart"
  | "SessionEnd"
  | "PostGenerate"
  | "PreExport"
  | "OnApprove";

export interface HookAction {
  type: "command";
  command: string;
  timeout?: number; // ms, default 10000
}

export interface HookConfig {
  matcher?: string; // "Edit|Write" or empty for all
  hooks: HookAction[];
}

export interface HookInput {
  session_id?: string;
  cwd: string;
  hook_event_name: HookEvent;
  tool_name?: string;
  tool_input?: unknown;
  tool_result?: unknown;
}

export interface HookOutput {
  decision?: "allow" | "deny";
  updatedInput?: unknown;
  message?: string;
}
