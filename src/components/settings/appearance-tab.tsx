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
    <div>
      <h3 className="text-[var(--text-headline)] font-semibold text-[var(--ink)]">Appearance</h3>
      <p className="mt-1 text-[var(--text-body-sm)] text-[var(--ink-tertiary)]">
        Customize the visual style of the application.
      </p>

      <div className="mt-8">
        <label className="block text-[var(--text-title)] font-medium text-[var(--ink)] mb-2">
          Theme
        </label>
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
