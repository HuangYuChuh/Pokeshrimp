"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, Chip, Skeleton } from "@/design-system/components";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

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
      .then((response) => response.json())
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
        <Card key={tool.name} className="overflow-hidden">
          <CardContent className="flex min-w-0 flex-wrap items-start gap-[var(--space-3)] px-[var(--space-3)] py-[var(--space-3)] leading-[var(--leading-normal)] max-[560px]:flex-col">
            <Icon
              icon={
                tool.status === "available"
                  ? "solar:check-circle-outline"
                  : "solar:close-circle-outline"
              }
              width={16}
              className={cn(
                "mt-[var(--space-1)] shrink-0",
                tool.status === "available" ? "text-[var(--success)]" : "text-[var(--error)]",
              )}
            />

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-[var(--space-2)]">
                <span
                  className="truncate text-[var(--text-body-sm)] font-medium text-[var(--ink)]"
                  title={tool.name}
                >
                  {tool.name}
                </span>
                <Chip size="sm" variant={tool.status === "available" ? "success" : "error"}>
                  {tool.status === "available" ? "Available" : "Not installed"}
                </Chip>
              </div>

              {tool.skills.length > 0 ? (
                <div className="mt-[var(--space-1)] flex min-w-0 flex-wrap items-center gap-[var(--space-2)]">
                  <span className="text-[var(--text-caption)] text-[var(--ink-tertiary)]">
                    Used by
                  </span>
                  {tool.skills.map((skill) => (
                    <Chip
                      key={`${tool.name}-${skill}`}
                      size="sm"
                      className="max-w-full font-[var(--font-mono)]"
                      title={skill}
                    >
                      <span className="block max-w-[18rem] truncate max-[640px]:max-w-[12rem]">
                        {skill}
                      </span>
                    </Chip>
                  ))}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
