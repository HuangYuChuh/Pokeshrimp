"use client";

import { useState, useEffect } from "react";

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
    return <p className="text-[13px] text-muted-foreground">Checking tools...</p>;
  }

  if (error) {
    return <p className="text-[13px] text-red-500">{error}</p>;
  }

  if (tools.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">
        No CLI tools required by installed skills.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tools.map((tool) => (
        <div
          key={tool.name}
          className="flex items-start gap-2.5 rounded-lg border border-border bg-background px-3 py-2"
        >
          <span
            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
              tool.status === "available" ? "bg-emerald-500" : "bg-red-500"
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[13px] font-medium">{tool.name}</span>
              <span
                className={`text-[11px] ${
                  tool.status === "available"
                    ? "text-emerald-500"
                    : "text-red-500"
                }`}
              >
                {tool.status === "available" ? "Available" : "Not installed"}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Used by: {tool.skills.join(", ")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
