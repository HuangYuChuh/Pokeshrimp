"use client";

import { Select } from "@/design-system/components";
import { SettingsSection, SettingsTabHeader } from "@/components/settings-sections";

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
    <div className="flex min-w-0 flex-col gap-[var(--space-8)]">
      <SettingsTabHeader
        title="Appearance"
        description="Customize the visual style of the application."
      />

      <SettingsSection label="Theme">
        <Select
          value={theme}
          onChange={(value) => onThemeChange(value as "dark" | "light" | "system")}
          options={THEME_OPTIONS}
          className="w-full"
        />
      </SettingsSection>
    </div>
  );
}
