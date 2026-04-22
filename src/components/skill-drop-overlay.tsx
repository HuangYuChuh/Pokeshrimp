"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Chip } from "@/design-system/components";

interface SkillDropOverlayProps {
  visible: boolean;
}

export function SkillDropOverlay({ visible }: SkillDropOverlayProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-[var(--overlay)] transition-opacity duration-200",
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div className="flex flex-col items-center gap-[var(--space-3)]">
        <Icon icon="solar:file-download-outline" width={48} className="text-[var(--ink)]" />
        <p className="text-[var(--text-title)] font-semibold text-[var(--ink)]">
          Drop <Chip size="sm">.skill.md</Chip> to install
        </p>
      </div>
    </div>
  );
}
