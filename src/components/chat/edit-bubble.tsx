"use client";

import { useRef, useEffect } from "react";
import { Button } from "@heroui/react";

interface EditBubbleProps {
  content: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EditBubble({ content, onChange, onSave, onCancel }: EditBubbleProps) {
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = editRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 300) + "px";
      el.focus();
    }
  }, [content]);

  return (
    <div className="w-full max-w-[85%]">
      <textarea
        ref={editRef}
        value={content}
        onChange={(e) => {
          onChange(e.target.value);
          const el = e.target;
          el.style.height = "auto";
          el.style.height = Math.min(el.scrollHeight, 300) + "px";
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSave();
          }
          if (e.key === "Escape") {
            onCancel();
          }
        }}
        className="block w-full resize-none rounded-2xl border border-border bg-card px-4 py-2.5 text-[14px] leading-7 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        rows={1}
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onPress={onCancel}
          className="text-[12px] font-medium text-muted-foreground"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onPress={onSave}
          className="bg-primary text-[12px] font-medium text-primary-foreground"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
