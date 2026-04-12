import type {
  ApprovalRequest,
  ApprovalResponse,
  ApprovalDecision,
} from "@/core/permission/approval";
import type { DataStreamWriter } from "ai";

// ─── ApprovalBus ─────────────────────────────────────────────
//
// Process-wide singleton. The chat route writes approval requests
// into it (via the data stream); the POST /api/approval endpoint
// resolves pending requests when the user clicks a button.

interface PendingEntry {
  resolve: (resp: ApprovalResponse) => void;
  timer: ReturnType<typeof setTimeout>;
}

const DEFAULT_TIMEOUT_MS = 60_000;

class ApprovalBus {
  private pending = new Map<string, PendingEntry>();

  /**
   * Send an approval request to the user via the data stream and
   * return a Promise that resolves when the user responds (or the
   * timeout fires → auto-deny).
   */
  request(
    req: ApprovalRequest,
    dataStream: DataStreamWriter,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ): Promise<ApprovalResponse> {
    // Write the request to the data stream so the frontend sees it
    dataStream.writeData({
      type: "approval-request",
      id: req.id,
      command: req.command,
      toolName: req.toolName,
      riskLevel: req.riskLevel,
      createdAt: req.createdAt,
    });

    return new Promise<ApprovalResponse>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(req.id);
        // Notify frontend that the request expired
        try {
          dataStream.writeData({
            type: "approval-resolved",
            id: req.id,
            decision: "deny",
            reason: "timeout",
          });
        } catch {
          // Stream may already be closed
        }
        resolve({ id: req.id, decision: "deny" });
      }, timeoutMs);

      this.pending.set(req.id, { resolve, timer });
    });
  }

  /**
   * Called by the POST /api/approval endpoint when the user clicks
   * a button. Returns true if the request was found and resolved.
   */
  respond(id: string, decision: ApprovalDecision): boolean {
    const entry = this.pending.get(id);
    if (!entry) return false;
    clearTimeout(entry.timer);
    this.pending.delete(id);
    entry.resolve({ id, decision });
    return true;
  }

  /**
   * Clean up a pending request (e.g. when the HTTP connection drops).
   */
  cleanup(id: string): void {
    const entry = this.pending.get(id);
    if (entry) {
      clearTimeout(entry.timer);
      this.pending.delete(id);
    }
  }
}

export const approvalBus = new ApprovalBus();
