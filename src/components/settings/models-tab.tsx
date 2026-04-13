"use client";

import { Select, ListBox } from "@heroui/react";
import { MODEL_OPTIONS } from "@/core/ai/provider";

interface ModelsTabProps {
  defaultModel: string;
  onDefaultModelChange: (model: string) => void;
}

export function ModelsTab({ defaultModel, onDefaultModelChange }: ModelsTabProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-[15px] font-semibold mb-4">Models</h3>

      <div>
        <div className="mb-1.5">
          <label className="text-[13px] font-medium text-foreground">
            Default Model
          </label>
        </div>
        <Select
          selectedKey={defaultModel}
          onSelectionChange={(key) => {
            if (key) onDefaultModelChange(String(key));
          }}
          className="w-full"
        >
          <Select.Trigger className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover className="rounded-lg border border-border bg-card shadow-lg">
            <ListBox>
              {MODEL_OPTIONS.map((m) => (
                <ListBox.Item key={m.id} id={m.id} textValue={m.label}>
                  {m.label}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    </div>
  );
}
