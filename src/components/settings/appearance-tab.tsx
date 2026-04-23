"use client";

import { Select } from "@/design-system/components";
import { SettingsSection, SettingsTabHeader } from "@/components/settings-sections";
import { useT, useLocale, setLocale, type Locale } from "@/lib/i18n";

interface AppearanceTabProps {
  theme: "dark" | "light" | "system";
  onThemeChange: (value: "dark" | "light" | "system") => void;
}

export function AppearanceTab({ theme, onThemeChange }: AppearanceTabProps) {
  const t = useT();
  const locale = useLocale();

  const themeOptions = [
    { value: "dark", label: t.dark },
    { value: "light", label: t.light },
    { value: "system", label: t.system },
  ];

  const languageOptions = [
    { value: "en", label: t.english },
    { value: "zh", label: t.chinese },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-[var(--space-8)]">
      <SettingsTabHeader title={t.appearance} description={t.appearanceDescription} />

      <SettingsSection label={t.theme}>
        <Select
          value={theme}
          onChange={(value) => onThemeChange(value as "dark" | "light" | "system")}
          options={themeOptions}
          className="w-full"
        />
      </SettingsSection>

      <SettingsSection label={t.languageLabel}>
        <Select
          value={locale}
          onChange={(value) => setLocale(value as Locale)}
          options={languageOptions}
          className="w-full"
        />
      </SettingsSection>
    </div>
  );
}
