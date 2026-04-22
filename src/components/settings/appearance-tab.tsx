"use client";

import { Select } from "@/design-system/components";

interface AppearanceTabProps {
  theme: "dark" | "light" | "system";
  onThemeChange: (value: "dark" | "light" | "system") => void;
}

const THEME_OPTIONS = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
];

export function AppearanceTab({ theme, onThemeChange }: AppearanceTabProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-[var(--text-title)] font-semibold mb-4">Appearance</h3>

      <div>
        <div className="mb-1.5">
          <label className="text-[var(--text-body-sm)] font-medium text-[var(--ink)]">Theme</label>
        </div>
        <Select
          value={theme}
          onChange={(v) => onThemeChange(v as "dark" | "light" | "system")}
          options={THEME_OPTIONS}
          className="w-full"
        />
      </div>
    </div>
  );
}
