"use client";

import { Icon } from "@iconify/react";
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
    <div className="space-y-6">
      <div className="flex items-center gap-[var(--gap-inline)]">
        <Icon icon="solar:palette-outline" width={18} className="text-[var(--ink-secondary)]" />
        <h3 className="text-[var(--text-headline)] font-semibold text-[var(--ink)]">Appearance</h3>
      </div>

      <div>
        <label className="mb-2 block text-[var(--text-body-sm)] font-medium text-[var(--ink)]">
          Theme
        </label>
        <p className="mb-3 text-[var(--text-caption)] text-[var(--ink-tertiary)]">
          Choose your preferred color scheme.
        </p>
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
