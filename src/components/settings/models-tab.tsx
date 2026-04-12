"use client";

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
        <select
          value={defaultModel}
          onChange={(e) => onDefaultModelChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
        >
          {MODEL_OPTIONS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
