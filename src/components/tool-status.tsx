"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Skeleton, Card, CardContent } from "@/design-system/components";

interface ToolStatus {
  name: string;
  status: "available" | "not-installed";
  skills: string[];
}

interface ToolStatusListProps {
  open: boolean;
}

export function ToolStatusList({ open }: ToolStatusListProps) {
  const [tools, setTools] = useState<ToolStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch("/api/tools")
      .then((r) => r.json())
      .then((data: { tools: ToolStatus[] }) => setTools(data.tools))
      .catch(() => setError("Failed to load tool status"))
      .finally(() => setLoading(false));
  }, [open]);

  if (loading) {
    return (
      <div className="space-y-[var(--space-2)]">
        <Skeleton className="h-[52px] w-full" />
        <Skeleton className="h-[52px] w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-[var(--text-body-sm)] text-[var(--error)]">{error}</p>;
  }

  if (tools.length === 0) {
    return (
      <p className="text-[var(--text-body-sm)] text-[var(--ink-tertiary)]">
        No CLI tools required by installed skills.
      </p>
    );
  }

  return (
    <div className="space-y-[var(--space-2)]">
      {tools.map((tool) => (
        <Card key={tool.name}>
          <CardContent className="flex items-center gap-[var(--space-3)] px-[var(--space-3)] py-[var(--space-2)]">
            <Icon
              icon={
                tool.status === "available"
                  ? "solar:check-circle-outline"
                  : "solar:close-circle-outline"
              }
              width={16}
              className={cn(
                "shrink-0",
                tool.status === "available" ? "text-[var(--success)]" : "text-[var(--error)]",
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-[var(--space-2)]">
                <span className="text-[var(--text-body-sm)] font-medium text-[var(--ink)]">
                  {tool.name}
                </span>
                <span
                  className={cn(
                    "text-[var(--text-micro)]",
                    tool.status === "available" ? "text-[var(--success)]" : "text-[var(--error)]",
                  )}
                >
                  {tool.status === "available" ? "Available" : "Not installed"}
                </span>
              </div>
              <p className="mt-[var(--space-1)] text-[var(--text-caption)] text-[var(--ink-tertiary)]">
                Used by: {tool.skills.join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
