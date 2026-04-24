"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { useT } from "@/lib/i18n";

/* ─── Types ── */

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

/* ─── Component ── */

export function ApprovalCard({ request, resolved }: ApprovalCardProps) {
  const t = useT();
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
            setError(t.approvalFailed);
          }
        }
      } catch (err) {
        console.error("Approval request failed:", err);
        setError(t.approvalConnectionError);
      } finally {
        setLoading(false);
      }
    },
    [request.id, t.approvalFailed, t.approvalConnectionError],
  );

  if (resolved && state === "pending") {
    const s = mapDecisionToState(resolved.decision, resolved.reason);
    if (s !== "pending") setState(s);
  }

  const isPending = state === "pending";
  const pattern = request.command.split(" ")[0] ?? request.command;

  return (
    <div className="mt-[var(--space-2)]">
      <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--warning)] bg-[var(--warning-subtle)]">
        {/* ── Header ── */}
        <div className="flex items-center gap-[var(--gap-inline)] px-[12px] py-[10px]">
          <Icon
            icon="solar:shield-warning-outline"
            width={18}
            className="shrink-0 text-[var(--warning)]"
          />
          <span className="text-[var(--text-body-sm)] font-semibold text-[var(--ink)]">
            {t.approvalRequired}
          </span>
          <span className="ml-auto font-[var(--font-mono)] text-[var(--text-micro)] uppercase text-[var(--warning)]">
            {t.riskLevel}: {request.riskLevel}
          </span>
        </div>

        {/* ── Command ── */}
        <div className="px-[12px] pb-[12px]">
          <code className="block rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--canvas)] px-[12px] py-[10px] font-[var(--font-mono)] text-[var(--text-body-sm)] text-[var(--ink)]">
            $ {request.command}
          </code>
        </div>

        {/* ── Actions ── */}
        <div className="px-[12px] pb-[12px]">
          {isPending ? (
            <div>
              <div className="flex items-center gap-[var(--gap-inline)]">
                {/* Allow Once — accent bg, white text */}
                <button
                  onClick={() => handleDecision("allow-once")}
                  disabled={loading}
                  className="h-[30px] rounded-[var(--radius-md)] bg-[var(--accent)] px-[14px] text-[var(--text-body-sm)] font-medium text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {t.allowOnce}
                </button>
                {/* Always Allow — outline */}
                <button
                  onClick={() => handleDecision("always-allow")}
                  disabled={loading}
                  className="h-[30px] rounded-[var(--radius-md)] border border-[var(--border)] bg-transparent px-[14px] text-[var(--text-body-sm)] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--border-subtle)] disabled:opacity-50"
                >
                  {t.alwaysAllow} <code className="ml-1 text-[var(--text-micro)]">{pattern}</code>
                </button>
                {/* Deny — outline error */}
                <button
                  onClick={() => handleDecision("deny")}
                  disabled={loading}
                  className="h-[30px] rounded-[var(--radius-md)] border border-[var(--error)] bg-transparent px-[14px] text-[var(--text-body-sm)] font-medium text-[var(--error)] transition-colors hover:bg-[var(--error-subtle)] disabled:opacity-50"
                >
                  {t.deny}
                </button>
              </div>
              {error && (
                <p className="mt-1.5 text-[var(--text-micro)] text-[var(--error)]">{error}</p>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "text-[var(--text-body-sm)] font-medium",
                state === "denied" || state === "expired"
                  ? "text-[var(--error)]"
                  : "text-[var(--success)]",
              )}
            >
              {state === "allowed" && t.allowedOnce}
              {state === "always-allowed" && t.alwaysAllowedSaved}
              {state === "denied" && t.denied}
              {state === "expired" && t.expired}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ── */

function mapDecisionToState(decision: string, reason?: string): CardState {
  if (decision === "deny" && reason === "timeout") return "expired";
  if (decision === "deny") return "denied";
  if (decision === "always-allow") return "always-allowed";
  if (decision === "allow-once") return "allowed";
  return "pending";
}

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
