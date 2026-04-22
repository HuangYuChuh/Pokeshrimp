"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Card, CardHeader, CardContent, Chip } from "@/design-system/components";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  state: string;
  args?: unknown;
  result?: unknown;
}

interface ToolCardProps {
  invocation: ToolInvocation;
}

export function ToolCard({ invocation }: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isDone = invocation.state === "result";
  const hasArgs = !!(
    invocation.args &&
    typeof invocation.args === "object" &&
    Object.keys(invocation.args as Record<string, unknown>).length > 0
  );
  const hasResult = !!(isDone && invocation.result != null);
  const canExpand = hasArgs || hasResult;

  const label = invocation.toolName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mt-[var(--space-2)]">
      <Card
        interactive={canExpand}
        className={cn("cursor-default", canExpand && "cursor-pointer")}
        onClick={() => canExpand && setExpanded(!expanded)}
      >
        <CardHeader className="flex flex-row items-center gap-[var(--gap-inline)] mb-0">
          <Chip size="sm" variant={isDone ? "success" : "warning"}>
            {isDone ? "Done" : "Running"}
          </Chip>
          <span className="text-[var(--text-caption)] font-medium text-[var(--ink)]">{label}</span>
          {hasArgs && (
            <span className="max-w-[200px] truncate text-[var(--text-caption)] text-[var(--ink-tertiary)]">
              {(() => {
                const entries = Object.entries(invocation.args as Record<string, unknown>);
                if (!entries.length) return "";
                const [k, v] = entries[0];
                const s = typeof v === "string" ? v : JSON.stringify(v);
                return `${k}: ${s.length > 30 ? s.slice(0, 30) + "..." : s}`;
              })()}
            </span>
          )}
          {canExpand && (
            <Icon
              icon="solar:alt-arrow-down-outline"
              width={12}
              className={cn("ml-auto shrink-0 transition-transform", expanded && "rotate-180")}
            />
          )}
        </CardHeader>

        {expanded && (
          <CardContent className="max-h-[300px] overflow-y-auto px-3 pb-3 pt-0 font-[var(--font-mono)] text-[var(--text-micro)] leading-relaxed text-[var(--ink-secondary)]">
            {hasArgs && (
              <>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-ghost)]">
                  Input
                </div>
                <pre className="mb-3 whitespace-pre-wrap break-all">
                  {formatVal(invocation.args)}
                </pre>
              </>
            )}
            {hasResult && (
              <>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-ghost)]">
                  Result
                </div>
                <pre className="whitespace-pre-wrap break-all">{formatVal(invocation.result)}</pre>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function formatVal(v: unknown): string {
  if (typeof v === "string") return v.length > 2000 ? v.slice(0, 2000) + "\n...(truncated)" : v;
  try {
    const s = JSON.stringify(v, null, 2);
    return s.length > 2000 ? s.slice(0, 2000) + "\n...(truncated)" : s;
  } catch {
    return String(v);
  }
}
