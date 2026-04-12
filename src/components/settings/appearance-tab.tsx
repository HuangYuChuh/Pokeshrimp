"use client";

interface AppearanceTabProps {
  theme: "dark" | "light" | "system";
  onThemeChange: (value: "dark" | "light" | "system") => void;
}

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
        <select
          value={theme}
          onChange={(e) =>
            onThemeChange(e.target.value as "dark" | "light" | "system")
          }
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="system">System</option>
        </select>
      </div>
    </div>
  );
}
