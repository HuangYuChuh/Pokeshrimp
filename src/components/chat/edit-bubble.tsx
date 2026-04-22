"use client";

import { useRef, useEffect } from "react";
import { Button, Card, CardContent, Textarea } from "@/design-system/components";

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
      <Card>
        <CardContent className="p-3">
          <Textarea
            ref={editRef}
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              onChange(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 300) + "px";
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSave();
              }
              if (e.key === "Escape") {
                onCancel();
              }
            }}
            className="block w-full resize-none border-none bg-transparent text-[var(--text-body)] leading-[var(--leading-relaxed)] shadow-none focus:outline-none focus:ring-0"
            rows={1}
          />
        </CardContent>
        <div className="flex justify-end gap-[var(--gap-inline)] px-3 pb-3 pt-0">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={onSave}>
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
}
