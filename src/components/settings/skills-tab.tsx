"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Skeleton, Chip } from "@heroui/react";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Upload,
  Puzzle,
  Globe,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Types
 * --------------------------------------------------------------------------- */

interface SkillInputParam {
  name: string;
  type: string;
  description?: string;
  default?: string;
}

interface SkillOutput {
  type: string;
  description?: string;
}

interface SkillData {
  name: string;
  command: string;
  description: string;
  scope: "global" | "project";
  requiredTools: string[];
  inputParams: SkillInputParam[];
  outputs: SkillOutput[];
}

interface SkillsTabProps {
  active: boolean;
}

/* ---------------------------------------------------------------------------
 * Component
 * --------------------------------------------------------------------------- */

export function SkillsTab({ active }: SkillsTabProps) {
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCommand, setExpandedCommand] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFetched = useRef(false);

  /* --- Fetch skills ------------------------------------------------------ */
  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/skills");
      if (res.ok) {
        const data = await res.json();
        setSkills(data.skills ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active && !hasFetched.current) {
      hasFetched.current = true;
      fetchSkills();
    }
  }, [active, fetchSkills]);

  /* --- Toast helper ------------------------------------------------------ */
  const showToast = useCallback((message: string, isError: boolean) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* --- Delete skill ------------------------------------------------------ */
  const handleDelete = useCallback(
    async (command: string) => {
      setDeleting(command);
      try {
        const res = await fetch(
          `/api/skills/${encodeURIComponent(command)}`,
          { method: "DELETE" },
        );
        const data = await res.json();
        if (res.ok) {
          setSkills((prev) => prev.filter((s) => s.command !== command));
          if (expandedCommand === command) setExpandedCommand(null);
          showToast(`Skill '${command}' deleted`, false);
        } else {
          showToast(data.error || "Failed to delete skill", true);
        }
      } catch {
        showToast("Failed to delete skill", true);
      } finally {
        setDeleting(null);
      }
    },
    [expandedCommand, showToast],
  );

  /* --- Import skill via file picker -------------------------------------- */
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      for (const file of files) {
        if (!file.name.endsWith(".skill.md")) {
          showToast("Only .skill.md files can be imported", true);
          continue;
        }
        try {
          const content = await file.text();
          const res = await fetch("/api/skills/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: file.name, content }),
          });
          const data = await res.json();
          if (res.ok) {
            showToast(`Skill '${data.name}' installed`, false);
          } else {
            showToast(data.error || "Failed to import skill", true);
          }
        } catch {
          showToast(`Failed to import ${file.name}`, true);
        }
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchSkills();
    },
    [fetchSkills, showToast],
  );

  /* --- Toggle expand ----------------------------------------------------- */
  const toggleExpand = useCallback((command: string) => {
    setExpandedCommand((prev) => (prev === command ? null : command));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold">Skills</h3>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-[12px]"
          onPress={handleImport}
        >
          <Upload size={13} strokeWidth={1.5} />
          Import
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".skill.md"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-[52px] w-full rounded-xl" />
          <Skeleton className="h-[52px] w-full rounded-xl" />
          <Skeleton className="h-[52px] w-full rounded-xl" />
        </div>
      ) : skills.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {skills.map((skill) => (
            <SkillCard
              key={skill.command}
              skill={skill}
              expanded={expandedCommand === skill.command}
              deleting={deleting === skill.command}
              onToggle={() => toggleExpand(skill.command)}
              onDelete={() => handleDelete(skill.command)}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-[13px] font-medium",
            toast.isError
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-foreground",
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Skill Card
 * --------------------------------------------------------------------------- */

function SkillCard({
  skill,
  expanded,
  deleting,
  onToggle,
  onDelete,
}: {
  skill: {
    name: string;
    command: string;
    description: string;
    scope: "global" | "project";
    requiredTools: string[];
    inputParams: { name: string; type: string; description?: string; default?: string }[];
    outputs: { type: string; description?: string }[];
  };
  expanded: boolean;
  deleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-2 text-left"
        >
          {expanded ? (
            <ChevronDown
              size={14}
              strokeWidth={1.5}
              className="shrink-0 text-muted-foreground"
            />
          ) : (
            <ChevronRight
              size={14}
              strokeWidth={1.5}
              className="shrink-0 text-muted-foreground"
            />
          )}
          <Puzzle
            size={14}
            strokeWidth={1.5}
            className="shrink-0 text-muted-foreground"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[13px] font-medium text-foreground">
                {skill.name}
              </span>
              <Chip size="sm" variant="soft" className="text-[11px]">
                /{skill.command}
              </Chip>
            </div>
            {skill.description && (
              <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                {skill.description}
              </p>
            )}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          <ScopeBadge scope={skill.scope} />
          {skill.scope === "project" && (
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              className="h-6 w-6 min-w-0 text-muted-foreground hover:text-destructive"
              onPress={(e) => {
                onDelete();
              }}
              isDisabled={deleting}
            >
              <Trash2 size={13} strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-3 py-3">
          <div className="space-y-3">
            {skill.requiredTools.length > 0 && (
              <DetailSection label="Required CLI tools">
                <div className="flex flex-wrap gap-1.5">
                  {skill.requiredTools.map((tool) => (
                    <Chip key={tool} size="sm" variant="soft" className="font-mono text-[12px]">
                      {tool}
                    </Chip>
                  ))}
                </div>
              </DetailSection>
            )}

            {skill.inputParams.length > 0 && (
              <DetailSection label="Input parameters">
                <div className="space-y-1.5">
                  {skill.inputParams.map((param) => (
                    <div key={param.name} className="text-[12px]">
                      <span className="font-mono font-medium text-foreground">
                        {param.name}
                      </span>
                      <span className="ml-1.5 text-muted-foreground">
                        ({param.type})
                      </span>
                      {param.description && (
                        <span className="ml-1.5 text-muted-foreground">
                          — {param.description}
                        </span>
                      )}
                      {param.default !== undefined && (
                        <span className="ml-1.5 text-muted-foreground/60">
                          default: {param.default}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}

            {skill.outputs.length > 0 && (
              <DetailSection label="Outputs">
                <div className="space-y-1">
                  {skill.outputs.map((output, i) => (
                    <div key={i} className="text-[12px]">
                      <span className="font-mono font-medium text-foreground">
                        {output.type}
                      </span>
                      {output.description && (
                        <span className="ml-1.5 text-muted-foreground">
                          — {output.description}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}

            {skill.requiredTools.length === 0 &&
              skill.inputParams.length === 0 &&
              skill.outputs.length === 0 && (
                <p className="text-[12px] text-muted-foreground">
                  No additional details available for this skill.
                </p>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Small helpers
 * --------------------------------------------------------------------------- */

function ScopeBadge({ scope }: { scope: "global" | "project" }) {
  return (
    <Chip size="sm" variant="soft" className="text-[11px]">
      <span className="flex items-center gap-1">
        {scope === "global" ? (
          <Globe size={10} strokeWidth={1.5} />
        ) : (
          <FolderOpen size={10} strokeWidth={1.5} />
        )}
        {scope}
      </span>
    </Chip>
  );
}

function DetailSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
        {label}
      </p>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Puzzle
        size={32}
        strokeWidth={1}
        className="mb-3 text-muted-foreground/40"
      />
      <p className="text-[13px] font-medium text-muted-foreground">
        No skills installed
      </p>
      <p className="mt-1 text-[12px] text-muted-foreground/60">
        Drag a .skill.md file onto the app or click Import.
      </p>
    </div>
  );
}
