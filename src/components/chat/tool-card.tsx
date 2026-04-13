"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Card, Chip } from "@heroui/react";

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
      <Card
        variant="default"
        className={cn(
          "cursor-default transition-colors",
          canExpand && "cursor-pointer hover:bg-muted"
        )}
      >
        <Card.Header
          className="flex flex-row items-center gap-2 px-3 py-2"
          onClick={() => canExpand && setExpanded(!expanded)}
        >
          <Chip
            size="sm"
            color={isDone ? "success" : "warning"}
            variant="soft"
          >
            {isDone ? "Done" : "Running"}
          </Chip>
          <Card.Title className="text-[12px] font-medium">{label}</Card.Title>
          {hasArgs && (
            <span className="max-w-[200px] truncate text-[12px] text-muted-foreground opacity-50">
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
        </Card.Header>

        {expanded && (
          <Card.Content className="max-h-[300px] overflow-y-auto px-3 pb-3 pt-0 font-mono text-[11px] leading-relaxed text-muted-foreground">
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
          </Card.Content>
        )}
      </Card>
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
