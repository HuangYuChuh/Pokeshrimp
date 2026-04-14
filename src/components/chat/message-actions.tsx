"use client";

import { cn } from "@/lib/utils";
import { Pencil, Trash2, RefreshCw } from "lucide-react";
import { Button, Card, Tooltip } from "@heroui/react";

interface MessageActionsProps {
  role: "user" | "assistant";
  onEdit?: () => void;
  onDelete: () => void;
  onRegenerate?: () => void;
}

export function MessageActions({ role, onEdit, onDelete, onRegenerate }: MessageActionsProps) {
  return (
    <Card
      variant="default"
      className={cn(
        "absolute -top-3 z-10 flex items-center gap-0.5 p-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100",
        role === "user" ? "right-0" : "left-0",
      )}
    >
      {role === "user" && onEdit && (
        <Tooltip>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={onEdit}
              className="h-6 w-6 min-w-0"
            >
              <Pencil size={13} />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>Edit</Tooltip.Content>
        </Tooltip>
      )}
      {role === "assistant" && onRegenerate && (
        <Tooltip>
          <Tooltip.Trigger>
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={onRegenerate}
              className="h-6 w-6 min-w-0"
            >
              <RefreshCw size={13} />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>Regenerate</Tooltip.Content>
        </Tooltip>
      )}
      <Tooltip>
        <Tooltip.Trigger>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={onDelete}
            className="h-6 w-6 min-w-0"
          >
            <Trash2 size={13} />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Delete</Tooltip.Content>
      </Tooltip>
    </Card>
  );
}
