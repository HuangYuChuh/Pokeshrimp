"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { useT } from "@/lib/i18n";

/* -----------------------------------------------------------------------
 * SkillDropOverlay
 * Full-screen drop hint with ESC / click-to-dismiss escape routes.
 * ----------------------------------------------------------------------- */

interface SkillDropOverlayProps {
  visible: boolean;
  onDismiss: () => void;
}

export function SkillDropOverlay({ visible, onDismiss }: SkillDropOverlayProps) {
  const t = useT();

  /* ESC key listener — only active while overlay is visible */
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visible, onDismiss]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm bg-[var(--overlay)] transition-opacity duration-200",
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      onClick={onDismiss}
    >
      {/* Stop propagation so clicking content doesn't dismiss via backdrop */}
      <div
        className="flex flex-col items-center gap-[var(--space-3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <Icon icon="solar:file-download-outline" width={48} className="text-[var(--ink)]" />
        <p className="text-[var(--text-title)] font-semibold text-[var(--ink)]">{t.dropSkill}</p>
        <span className="text-[var(--text-caption)] text-[var(--ink-ghost)]">
          {t.pressEscToCancel}
        </span>
      </div>
    </div>
  );
}
