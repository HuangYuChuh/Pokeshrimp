"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";

export interface ApprovalRequestData {
  type: "approval-request";
  id: string;
  command: string;
  toolName: string;
  riskLevel: "safe" | "moderate" | "dangerous";
  createdAt: number;
}

export interface ApprovalResolvedData {
  type: "approval-resolved";
  id: string;
  decision: string;
  reason?: string;
}

type CardState = "pending" | "allowed" | "always-allowed" | "denied" | "expired";

interface ApprovalCardProps {
  request: ApprovalRequestData;
  resolved?: ApprovalResolvedData;
}

export function ApprovalCard({ request, resolved }: ApprovalCardProps) {
  const [state, setState] = useState<CardState>(
    resolved ? mapDecisionToState(resolved.decision, resolved.reason) : "pending",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecision = useCallback(
    async (decision: "allow-once" | "always-allow" | "deny") => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/approval", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: request.id, decision }),
        });
        if (res.ok) {
          setState(
            decision === "allow-once"
              ? "allowed"
              : decision === "always-allow"
                ? "always-allowed"
                : "denied",
          );
        } else {
          const data = await res.json().catch(() => ({}));
          if (res.status === 410) {
            setState("expired");
          } else {
            console.error("Approval failed:", data);
            setError("Failed to send approval — server error");
          }
        }
      } catch (err) {
        console.error("Approval request failed:", err);
        setError("Failed to send approval — check your connection");
      } finally {
        setLoading(false);
      }
    },
    [request.id],
  );

  // If the server already resolved this (e.g. timeout), respect that
  if (resolved && state === "pending") {
    const s = mapDecisionToState(resolved.decision, resolved.reason);
    if (s !== "pending") setState(s);
  }

  const isPending = state === "pending";
  const riskColor =
    request.riskLevel === "dangerous"
      ? "text-red-400"
      : request.riskLevel === "safe"
        ? "text-green-400"
        : "text-yellow-400";

  const RiskIcon =
    request.riskLevel === "dangerous"
      ? ShieldX
      : request.riskLevel === "safe"
        ? ShieldCheck
        : ShieldAlert;

  return (
    <div className="mt-2 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <RiskIcon size={18} className={cn("mt-0.5 shrink-0", riskColor)} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-foreground">
            Command Approval Required
          </div>
          <code className="mt-1.5 block truncate rounded bg-muted px-2 py-1 font-mono text-[12px] text-muted-foreground">
            $ {request.command}
          </code>
          <div className={cn("mt-1 text-[11px]", riskColor)}>
            Risk: {request.riskLevel}
          </div>

          {isPending ? (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDecision("allow-once")}
                  disabled={loading}
                  className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Allow Once
                </button>
                <button
                  onClick={() => handleDecision("always-allow")}
                  disabled={loading}
                  className="rounded-md border border-border px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Always Allow
                </button>
                <button
                  onClick={() => handleDecision("deny")}
                  disabled={loading}
                  className="rounded-md border border-destructive/30 px-3 py-1.5 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
                >
                  Deny
                </button>
              </div>
              {error && (
                <p className="mt-1.5 text-[11px] text-red-500">{error}</p>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "mt-3 text-[12px] font-medium",
                state === "denied" || state === "expired"
                  ? "text-destructive"
                  : "text-green-500",
              )}
            >
              {state === "allowed" && "Allowed (once)"}
              {state === "always-allowed" && "Always allowed — pattern saved to config"}
              {state === "denied" && "Denied"}
              {state === "expired" && "Expired — auto-denied after timeout"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function mapDecisionToState(decision: string, reason?: string): CardState {
  if (decision === "deny" && reason === "timeout") return "expired";
  if (decision === "deny") return "denied";
  if (decision === "always-allow") return "always-allowed";
  if (decision === "allow-once") return "allowed";
  return "pending";
}

/**
 * Parse the useChat `data` array for approval events.
 * Returns maps keyed by request ID for easy lookup.
 */
export function parseApprovalEvents(data: unknown[]): {
  requests: Map<string, ApprovalRequestData>;
  resolved: Map<string, ApprovalResolvedData>;
} {
  const requests = new Map<string, ApprovalRequestData>();
  const resolved = new Map<string, ApprovalResolvedData>();

  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    if (obj.type === "approval-request" && typeof obj.id === "string") {
      requests.set(obj.id, obj as unknown as ApprovalRequestData);
    }
    if (obj.type === "approval-resolved" && typeof obj.id === "string") {
      resolved.set(obj.id, obj as unknown as ApprovalResolvedData);
    }
  }

  return { requests, resolved };
}
