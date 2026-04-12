// ─── Event Names ─────────────────────────────────────────────
//
// Per docs/01 §3.5 "Hooks 机制（Git Hooks 哲学）":
// Named business events at well-defined lifecycle points.
// Shell scripts hook into these events, not raw tool calls.

export type HookEventName =
  | "session-start"
  | "pre-tool-call"
  | "post-tool-call"
  | "post-generate"
  | "pre-export"
  | "on-error"
  | "on-approve"
  | "session-end";

/** Events where the hook script can deny/modify the operation. */
export const BLOCKING_EVENTS: ReadonlySet<HookEventName> = new Set([
  "pre-tool-call",
  "pre-export",
]);

// ─── Hook Configuration ──────────────────────────────────────

export interface HookEntry {
  /** Shell command to run. */
  command: string;
  /** Timeout in ms (default 10 000). */
  timeout: number;
  /** Optional glob matcher to filter which tool/command triggers this hook. */
  matcher?: string;
}

// ─── stdin / stdout Contracts ────────────────────────────────

export interface HookPayload {
  event: HookEventName;
  tool?: string;
  input?: unknown;
  result?: unknown;
  command?: string;
  output_files?: string[];
  output_path?: string;
  error?: string;
  decision?: string;
  session_id?: string;
  cwd: string;
}

export interface HookResponse {
  decision?: "allow" | "deny";
  reason?: string;
  modified_input?: unknown;
  message?: string;
}
