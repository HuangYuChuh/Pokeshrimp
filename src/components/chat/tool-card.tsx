"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { useT } from "@/lib/i18n";
import { Button } from "@/design-system/components";

/* ─── Types ── */

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

/* ─── Component ── */

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
      <div
        role={canExpand ? "button" : undefined}
        tabIndex={canExpand ? 0 : undefined}
        onClick={() => canExpand && setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (canExpand && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        className={cn(
          "overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]",
          canExpand && "cursor-pointer",
        )}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-[var(--gap-inline)] border-b border-[var(--border-subtle)] px-[12px] py-[8px]">
          <Icon
            icon="solar:code-square-outline"
            width={14}
            className="shrink-0 text-[var(--ink-tertiary)]"
          />
          <span className="font-[var(--font-mono)] text-[var(--text-caption)] font-medium text-[var(--ink)]">
            {label}
          </span>

          <div className="ml-auto flex items-center gap-[var(--space-1)]">
            <span
              className={cn(
                "inline-block h-[6px] w-[6px] rounded-full",
                isDone
                  ? "bg-[var(--success)]"
                  : "bg-[var(--warning)] animate-[pulse_1.2s_infinite]",
              )}
            />
            <span className="font-[var(--font-mono)] text-[var(--text-micro)] text-[var(--ink-tertiary)]">
              {isDone ? t.done : `${t.running}...`}
            </span>
          </div>
        </div>

        {/* ── Body (expanded) ── */}
        {expanded && (
          <div className="selectable max-h-[300px] overflow-y-auto bg-[var(--canvas-subtle)] px-[12px] py-[10px] font-[var(--font-mono)] text-[var(--text-caption)] leading-[1.65] text-[var(--ink-secondary)] [white-space:pre-wrap]">
            {hasArgs && <PreBlock label={t.input} value={formatVal(invocation.args)} />}
            {hasResult && <PreBlock label={t.result} value={formatVal(invocation.result)} />}
          </div>
        )}
      </div>
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
      <div className="mb-[var(--space-1)] flex items-center justify-between">
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

/* ─── Helpers ── */

function formatVal(v: unknown): string {
  if (typeof v === "string") return v.length > 2000 ? v.slice(0, 2000) + "\n...(truncated)" : v;
  try {
    const s = JSON.stringify(v, null, 2);
    return s.length > 2000 ? s.slice(0, 2000) + "\n...(truncated)" : s;
  } catch {
    return String(v);
  }
}
