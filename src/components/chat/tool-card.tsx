"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

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

  const label = invocation.toolName
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => canExpand && setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[12px] text-muted-foreground transition-colors",
          canExpand && "cursor-pointer hover:bg-muted"
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            isDone ? "bg-green-400" : "animate-pulse bg-yellow-400"
          )}
        />
        <span className="font-medium text-foreground">{label}</span>
        {hasArgs && (
          <span className="max-w-[200px] truncate opacity-50">
            {(() => {
              const entries = Object.entries(
                invocation.args as Record<string, unknown>
              );
              if (!entries.length) return "";
              const [k, v] = entries[0];
              const s = typeof v === "string" ? v : JSON.stringify(v);
              return `${k}: ${s.length > 30 ? s.slice(0, 30) + "..." : s}`;
            })()}
          </span>
        )}
        {canExpand && (
          <ChevronDown
            size={12}
            className={cn(
              "ml-auto shrink-0 transition-transform",
              expanded && "rotate-180"
            )}
          />
        )}
      </button>

      {expanded && (
        <div className="selectable ml-3 mt-1 max-h-[300px] overflow-y-auto rounded-lg border border-border bg-background p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {hasArgs && (
            <>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                Input
              </div>
              <pre className="mb-3 whitespace-pre-wrap break-all">
                {formatVal(invocation.args)}
              </pre>
            </>
          )}
          {hasResult && (
            <>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                Result
              </div>
              <pre className="whitespace-pre-wrap break-all">
                {formatVal(invocation.result)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function formatVal(v: unknown): string {
  if (typeof v === "string")
    return v.length > 2000 ? v.slice(0, 2000) + "\n...(truncated)" : v;
  try {
    const s = JSON.stringify(v, null, 2);
    return s.length > 2000 ? s.slice(0, 2000) + "\n...(truncated)" : s;
  } catch {
    return String(v);
  }
}
