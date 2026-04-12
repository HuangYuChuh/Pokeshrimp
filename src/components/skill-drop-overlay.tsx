"use client";

import { cn } from "@/lib/utils";
import { FileDown } from "lucide-react";

/* ---------------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------------- */

interface SkillDropOverlayProps {
  visible: boolean;
}

/* ---------------------------------------------------------------------------
 * SkillDropOverlay
 *
 * Full-screen overlay shown when the user drags a .skill.md file over the
 * window. Uses pointer-events-none when inactive so it never blocks clicks,
 * and a smooth opacity fade for the transition.
 * --------------------------------------------------------------------------- */

export function SkillDropOverlay({ visible }: SkillDropOverlayProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 transition-opacity duration-200",
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
      )}
    >
      <div className="flex flex-col items-center gap-3">
        <FileDown size={48} strokeWidth={1.2} className="text-foreground" />
        <p className="text-[15px] font-semibold text-foreground">
          Drop{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
            .skill.md
          </code>{" "}
          to install
        </p>
      </div>
    </div>
  );
}
