"use client";

import { cn } from "@/lib/utils";
import { Pencil, Trash2, RefreshCw } from "lucide-react";

interface MessageActionsProps {
  role: "user" | "assistant";
  onEdit?: () => void;
  onDelete: () => void;
  onRegenerate?: () => void;
}

export function MessageActions({ role, onEdit, onDelete, onRegenerate }: MessageActionsProps) {
  return (
    <div
      className={cn(
        "absolute -top-3 flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 shadow-sm opacity-0 transition-opacity group-hover/msg:opacity-100",
        role === "user" ? "right-0" : "left-0"
      )}
    >
      {role === "user" && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Edit"
        >
          <Pencil size={13} />
        </button>
      )}
      {role === "assistant" && onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Regenerate"
        >
          <RefreshCw size={13} />
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        title="Delete"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
