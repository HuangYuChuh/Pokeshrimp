"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import {
  Button,
  Card,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/design-system/components";

interface MessageActionsProps {
  role: "user" | "assistant";
  onEdit?: () => void;
  onDelete: () => void;
  onRegenerate?: () => void;
}

export function MessageActions({ role, onEdit, onDelete, onRegenerate }: MessageActionsProps) {
  return (
    <TooltipProvider>
      <Card
        className={cn(
          "mt-[var(--space-1)] flex items-center gap-0.5 p-0.5 opacity-0 transition-opacity group-hover/msg:opacity-100",
          role === "user" ? "justify-end" : "justify-start",
        )}
      >
        {role === "user" && onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={onEdit}>
                <Icon icon="solar:pen-outline" width={13} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
        )}
        {role === "assistant" && onRegenerate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={onRegenerate}>
                <Icon icon="solar:refresh-outline" width={13} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Regenerate</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onDelete}>
              <Icon icon="solar:trash-bin-2-outline" width={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </Card>
    </TooltipProvider>
  );
}
