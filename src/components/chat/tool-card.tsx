"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { useT } from "@/lib/i18n";
import { Card, CardHeader, CardContent, Chip, Button } from "@/design-system/components";

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
  const t = useT();
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
            {isDone ? (
              t.done
            ) : (
              <span className="flex items-center gap-[var(--space-1)]">
                <Icon icon="solar:loading-outline" width={11} className="animate-spin" />
                {t.running}
              </span>
            )}
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
          <CardContent className="selectable max-h-[300px] overflow-y-auto px-[var(--space-3)] pb-[var(--space-3)] pt-0 font-[var(--font-mono)] text-[var(--text-micro)] leading-relaxed text-[var(--ink-secondary)]">
            {hasArgs && <PreBlock label={t.input} value={formatVal(invocation.args)} />}
            {hasResult && <PreBlock label={t.result} value={formatVal(invocation.result)} />}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

/* ─── Pre block with copy button ── */

function PreBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(value).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    },
    [value],
  );

  return (
    <div className="mb-[var(--space-3)]">
      <div className="flex items-center justify-between mb-[var(--space-1)]">
        <span className="text-[10px] font-semibold uppercase tracking-[var(--tracking-wide)] text-[var(--ink-ghost)]">
          {label}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
          className="h-5 w-5"
        >
          <Icon icon={copied ? "solar:check-circle-outline" : "solar:copy-outline"} width={12} />
        </Button>
      </div>
      <pre className="whitespace-pre-wrap break-all">{value}</pre>
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
