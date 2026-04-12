"use client";

import { FileDown } from "lucide-react";

interface SkillDropOverlayProps {
  visible: boolean;
}

export function SkillDropOverlay({ visible }: SkillDropOverlayProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-200">
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/40 bg-background/60 px-12 py-10">
        <FileDown size={48} strokeWidth={1.2} className="text-primary" />
        <p className="text-lg font-medium text-foreground">
          Drop <code className="rounded bg-muted px-1.5 py-0.5 text-sm">.skill.md</code> to install
        </p>
      </div>
    </div>
  );
}
