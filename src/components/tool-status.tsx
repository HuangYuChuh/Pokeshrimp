"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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
      <div className="space-y-2">
        <Skeleton className="h-[52px] w-full rounded-lg" />
        <Skeleton className="h-[52px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return <p className="text-[13px] text-[var(--error)]">{error}</p>;
  }

  if (tools.length === 0) {
    return (
      <p className="text-[13px] text-[var(--ink-secondary)]">
        No CLI tools required by installed skills.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tools.map((tool) => (
        <Card key={tool.name}>
          <CardContent className="flex items-start gap-2.5 px-3 py-2">
            <span
              className={cn(
                "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                tool.status === "available" ? "bg-[var(--success)]" : "bg-[var(--error)]",
              )}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium">{tool.name}</span>
                <span
                  className={cn(
                    "text-[11px]",
                    tool.status === "available" ? "text-[var(--success)]" : "text-[var(--error)]",
                  )}
                >
                  {tool.status === "available" ? "Available" : "Not installed"}
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-[var(--ink-secondary)]">
                Used by: {tool.skills.join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
