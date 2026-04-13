"use client";

import { Select, ListBox } from "@heroui/react";

interface AppearanceTabProps {
  theme: "dark" | "light" | "system";
  onThemeChange: (value: "dark" | "light" | "system") => void;
}

const THEME_OPTIONS = [
  { id: "dark", label: "Dark" },
  { id: "light", label: "Light" },
  { id: "system", label: "System" },
] as const;

export function AppearanceTab({ theme, onThemeChange }: AppearanceTabProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-[15px] font-semibold mb-4">Appearance</h3>

      <div>
        <div className="mb-1.5">
          <label className="text-[13px] font-medium text-foreground">
            Theme
          </label>
        </div>
        <Select
          selectedKey={theme}
          onSelectionChange={(key) => {
            if (key) onThemeChange(String(key) as "dark" | "light" | "system");
          }}
          fullWidth
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {THEME_OPTIONS.map((opt) => (
                <ListBox.Item key={opt.id} id={opt.id} textValue={opt.label}>
                  {opt.label}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
    </div>
  );
}
