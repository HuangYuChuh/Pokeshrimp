"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Button, Card, CardHeader, CardContent, Chip } from "@/design-system/components";

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

const RISK_CHIP_VARIANT = {
  safe: "success",
  moderate: "warning",
  dangerous: "error",
} as const;

const RISK_ICON = {
  safe: "solar:shield-check-outline",
  moderate: "solar:shield-warning-outline",
  dangerous: "solar:shield-cross-outline",
} as const;

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

  if (resolved && state === "pending") {
    const s = mapDecisionToState(resolved.decision, resolved.reason);
    if (s !== "pending") setState(s);
  }

  const isPending = state === "pending";

  return (
    <Card className="mt-[var(--space-2)]">
      <CardHeader className="flex flex-row items-start gap-[var(--space-3)]">
        <Icon
          icon={RISK_ICON[request.riskLevel]}
          width={18}
          className="mt-0.5 shrink-0 text-[var(--ink-secondary)]"
        />
        <div className="min-w-0 flex-1">
          <span className="text-[var(--text-body-sm)] font-medium text-[var(--ink)]">
            Command Approval Required
          </span>
          <code className="mt-1.5 block truncate rounded-[var(--radius-sm)] bg-[var(--border-subtle)] px-2 py-1 font-[var(--font-mono)] text-[var(--text-caption)] text-[var(--ink-secondary)]">
            $ {request.command}
          </code>
          <Chip size="sm" variant={RISK_CHIP_VARIANT[request.riskLevel]} className="mt-2">
            Risk: {request.riskLevel}
          </Chip>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-[var(--space-3)]">
        {isPending ? (
          <div className="ml-[30px]">
            <div className="flex items-center gap-[var(--gap-inline)]">
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleDecision("allow-once")}
                disabled={loading}
              >
                Allow Once
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDecision("always-allow")}
                disabled={loading}
              >
                Always Allow
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDecision("deny")}
                disabled={loading}
              >
                Deny
              </Button>
            </div>
            {error && (
              <p className="mt-1.5 text-[var(--text-micro)] text-[var(--error)]">{error}</p>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "ml-[30px] text-[var(--text-caption)] font-medium",
              state === "denied" || state === "expired"
                ? "text-[var(--error)]"
                : "text-[var(--success)]",
            )}
          >
            {state === "allowed" && "Allowed (once)"}
            {state === "always-allowed" && "Always allowed — pattern saved to config"}
            {state === "denied" && "Denied"}
            {state === "expired" && "Expired — auto-denied after timeout"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
