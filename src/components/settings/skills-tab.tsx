"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Skeleton, Chip, Card, CardContent } from "@/design-system/components";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

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

export function SkillsTab({ active }: SkillsTabProps) {
  const [skills, setSkills] = useState<SkillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCommand, setExpandedCommand] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFetched = useRef(false);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/skills");
      if (res.ok) {
        const data = await res.json();
        setSkills(data.skills ?? []);
      }
    } catch {
      /* ignore */
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

  const showToast = useCallback((message: string, isError: boolean) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleDelete = useCallback(
    async (command: string) => {
      setDeleting(command);
      try {
        const res = await fetch(`/api/skills/${encodeURIComponent(command)}`, { method: "DELETE" });
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

  const toggleExpand = useCallback((command: string) => {
    setExpandedCommand((prev) => (prev === command ? null : command));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[var(--text-headline)] font-semibold text-[var(--ink)]">Skills</h3>
          <p className="mt-1 text-[var(--text-body-sm)] text-[var(--ink-tertiary)]">
            Installed .skill.md files that teach the agent CLI tools.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleImport}>
          <Icon icon="solar:upload-outline" width={13} className="mr-[var(--space-2)]" />
          Import
        </Button>
      </div>

      <div className="mt-8 space-y-[var(--space-3)]">
        <input
          ref={fileInputRef}
          type="file"
          accept=".skill.md"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {loading ? (
          <div className="space-y-[var(--space-3)]">
            <Skeleton className="h-[52px] w-full" />
            <Skeleton className="h-[52px] w-full" />
            <Skeleton className="h-[52px] w-full" />
          </div>
        ) : skills.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-[var(--space-2)]">
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
      </div>

      {toast && (
        <Card>
          <CardContent
            className={cn(
              "px-[var(--space-3)] py-2 text-[var(--text-body-sm)] font-medium",
              toast.isError ? "text-[var(--error)]" : "text-[var(--ink)]",
            )}
          >
            {toast.message}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SkillCard({
  skill,
  expanded,
  deleting,
  onToggle,
  onDelete,
}: {
  skill: SkillData;
  expanded: boolean;
  deleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-0 overflow-hidden">
        <div className="flex items-center gap-[var(--gap-inline)] px-[var(--space-3)] py-2.5 min-w-0">
          <button
            type="button"
            onClick={onToggle}
            className="flex flex-1 items-center gap-[var(--gap-inline)] text-left"
          >
            <Icon
              icon={expanded ? "solar:alt-arrow-down-outline" : "solar:alt-arrow-right-outline"}
              width={14}
              className="shrink-0 text-[var(--ink-tertiary)]"
            />
            <Icon
              icon="solar:widget-outline"
              width={14}
              className="shrink-0 text-[var(--ink-tertiary)]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-[var(--gap-inline)]">
                <span className="truncate text-[var(--text-body-sm)] font-medium text-[var(--ink)]">
                  {skill.name}
                </span>
                <Chip size="sm">/{skill.command}</Chip>
              </div>
              {skill.description && (
                <p className="mt-0.5 truncate text-[var(--text-caption)] text-[var(--ink-tertiary)]">
                  {skill.description}
                </p>
              )}
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-[var(--space-2)]">
            <ScopeBadge scope={skill.scope} />
            {skill.scope === "project" && (
              <Button
                variant="danger"
                size="sm"
                onClick={onDelete}
                disabled={deleting}
                className="h-6 w-6 min-w-0 p-0"
                aria-label={`Delete ${skill.command}`}
              >
                <Icon icon="solar:trash-bin-2-outline" width={13} />
              </Button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="border-t border-[var(--border)] px-[var(--space-3)] py-3">
            <div className="space-y-[var(--space-3)]">
              {skill.requiredTools.length > 0 && (
                <DetailSection label="Required CLI tools">
                  <div className="flex flex-wrap gap-[var(--space-2)]">
                    {skill.requiredTools.map((tool) => (
                      <Chip key={tool} size="sm" className="font-[var(--font-mono)]">
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
                      <div key={param.name} className="text-[var(--text-caption)]">
                        <span className="font-[var(--font-mono)] font-medium text-[var(--ink)]">
                          {param.name}
                        </span>
                        <span className="ml-1.5 text-[var(--ink-tertiary)]">({param.type})</span>
                        {param.description && (
                          <span className="ml-1.5 text-[var(--ink-tertiary)]">
                            — {param.description}
                          </span>
                        )}
                        {param.default !== undefined && (
                          <span className="ml-1.5 text-[var(--ink-ghost)]">
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
                  <div className="space-y-[var(--space-1)]">
                    {skill.outputs.map((output, i) => (
                      <div key={i} className="text-[var(--text-caption)]">
                        <span className="font-[var(--font-mono)] font-medium text-[var(--ink)]">
                          {output.type}
                        </span>
                        {output.description && (
                          <span className="ml-1.5 text-[var(--ink-tertiary)]">
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
                  <p className="text-[var(--text-caption)] text-[var(--ink-tertiary)]">
                    No additional details available.
                  </p>
                )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScopeBadge({ scope }: { scope: "global" | "project" }) {
  return (
    <Chip size="sm">
      <span className="flex items-center gap-[var(--space-1)]">
        <Icon
          icon={scope === "global" ? "solar:globe-outline" : "solar:folder-open-outline"}
          width={10}
        />
        {scope}
      </span>
    </Chip>
  );
}

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[var(--text-micro)] font-medium uppercase tracking-wider text-[var(--ink-ghost)]">
        {label}
      </p>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon icon="solar:widget-outline" width={32} className="mb-3 text-[var(--ink-ghost)]" />
      <p className="text-[var(--text-body-sm)] font-medium text-[var(--ink-secondary)]">
        No skills installed
      </p>
      <p className="mt-1 text-[var(--text-caption)] text-[var(--ink-ghost)]">
        Drag a .skill.md file onto the app or click Import.
      </p>
    </div>
  );
}
