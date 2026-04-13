"use client";

import { useRef, useEffect } from "react";
import { Button, Card, TextArea } from "@heroui/react";

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
        <Card.Content className="p-3">
          <TextArea
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
            variant="secondary"
            className="block w-full resize-none border-none text-[14px] leading-7 shadow-none focus:outline-none"
            rows={1}
          />
        </Card.Content>
        <Card.Footer className="flex justify-end gap-2 px-3 pb-3 pt-0">
          <Button
            variant="ghost"
            size="sm"
            onPress={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onPress={onSave}
          >
            Save
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
