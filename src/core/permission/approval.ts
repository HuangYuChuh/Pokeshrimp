// ─── Types ───────────────────────────────────────────────────
//
// The core layer defines interfaces only — no transport, no React,
// no Next.js. The API layer provides the concrete implementation.

export type ApprovalDecision = "allow-once" | "always-allow" | "deny";

export type RiskLevel = "safe" | "moderate" | "dangerous";

export interface ApprovalRequest {
  /** Unique request ID (caller generates). */
  id: string;
  /** The shell command awaiting approval. */
  command: string;
  /** Tool name (always "run_command" today, but generic). */
  toolName: string;
  /** Display-only risk assessment. */
  riskLevel: RiskLevel;
  /** When the request was created (Date.now()). */
  createdAt: number;
}

export interface ApprovalResponse {
  /** Must match the request ID. */
  id: string;
  decision: ApprovalDecision;
}

/**
 * Abstraction so core/ never depends on Next.js or any transport.
 * The API layer injects a concrete implementation that writes to the
 * data stream and waits for the user's HTTP response.
 */
export interface ApprovalChannel {
  /**
   * Send an approval request to the user. Returns when the user
   * responds or the timeout expires (auto-deny).
   */
  request(req: ApprovalRequest): Promise<ApprovalResponse>;
}
