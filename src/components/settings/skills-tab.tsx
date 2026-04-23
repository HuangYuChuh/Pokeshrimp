"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Button, Card, CardContent, Chip, Skeleton } from "@/design-system/components";
import { SettingsTabHeader } from "@/components/settings-sections";
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
          setSkills((prev) => prev.filter((skill) => skill.command !== command));
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
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
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
    <div className="flex min-w-0 flex-col gap-[var(--space-6)]">
      <SettingsTabHeader
        title="Skills"
        description="Installed .skill.md files that teach the agent CLI tools."
        action={
          <Button variant="outline" size="sm" onClick={handleImport} className="max-[520px]:w-full">
            <Icon icon="solar:upload-outline" width={13} />
            Import
          </Button>
        }
      />

      <div className="flex min-w-0 flex-col gap-[var(--space-3)]">
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

      {toast ? (
        <Card className="overflow-hidden">
          <CardContent
            role={toast.isError ? "alert" : "status"}
            aria-live={toast.isError ? "assertive" : "polite"}
            className={cn(
              "px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-body-sm)] font-medium leading-[var(--leading-normal)]",
              toast.isError ? "text-[var(--error)]" : "text-[var(--ink)]",
            )}
          >
            {toast.message}
          </CardContent>
        </Card>
      ) : null}
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
  const detailsId = `skill-details-${skill.command.replace(/[^a-zA-Z0-9_-]+/g, "-")}`;
  const commandLabel = `/${skill.command}`;

  return (
    <Card className="overflow-hidden">
      <CardContent className="overflow-hidden p-0 text-[var(--text-body-sm)] leading-[var(--leading-normal)]">
        <div className="flex min-w-0 flex-wrap items-start gap-[var(--space-3)] px-[var(--space-3)] py-[var(--space-3)] max-[560px]:flex-col">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={detailsId}
            className="flex min-w-0 flex-1 items-start gap-[var(--gap-inline)] text-left"
          >
            <Icon
              icon={expanded ? "solar:alt-arrow-down-outline" : "solar:alt-arrow-right-outline"}
              width={14}
              className="mt-[var(--space-1)] shrink-0 text-[var(--ink-tertiary)]"
            />
            <Icon
              icon="solar:widget-outline"
              width={14}
              className="mt-[var(--space-1)] shrink-0 text-[var(--ink-tertiary)]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-[var(--space-2)]">
                <span
                  className="truncate text-[var(--text-body-sm)] font-medium text-[var(--ink)]"
                  title={skill.name}
                >
                  {skill.name}
                </span>
                <Chip size="sm" className="max-w-full font-[var(--font-mono)]" title={commandLabel}>
                  <span className="block max-w-[18rem] truncate max-[640px]:max-w-[12rem]">
                    {commandLabel}
                  </span>
                </Chip>
              </div>
              {skill.description ? (
                <p
                  className="mt-[var(--space-1)] truncate text-[var(--text-caption)] text-[var(--ink-tertiary)]"
                  title={skill.description}
                >
                  {skill.description}
                </p>
              ) : null}
            </div>
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-[var(--space-2)] max-[560px]:ml-0">
            <ScopeBadge scope={skill.scope} />
            {skill.scope === "project" ? (
              <Button
                variant="danger"
                size="sm"
                onClick={onDelete}
                disabled={deleting}
                className="h-[var(--space-6)] w-[var(--space-6)] min-w-0 p-0"
                aria-label={`Delete ${skill.command}`}
              >
                <Icon icon="solar:trash-bin-2-outline" width={13} />
              </Button>
            ) : null}
          </div>
        </div>

        {expanded ? (
          <div
            id={detailsId}
            className="border-t border-[var(--border)] px-[var(--space-3)] py-[var(--space-3)]"
          >
            <div className="space-y-[var(--space-3)]">
              {skill.requiredTools.length > 0 ? (
                <DetailSection label="Required CLI tools">
                  <div className="flex flex-wrap gap-[var(--space-2)]">
                    {skill.requiredTools.map((tool) => (
                      <Chip
                        key={tool}
                        size="sm"
                        className="max-w-full font-[var(--font-mono)]"
                        title={tool}
                      >
                        <span className="block max-w-[18rem] truncate">{tool}</span>
                      </Chip>
                    ))}
                  </div>
                </DetailSection>
              ) : null}

              {skill.inputParams.length > 0 ? (
                <DetailSection label="Input parameters">
                  <div className="space-y-[var(--space-2)]">
                    {skill.inputParams.map((param) => (
                      <div
                        key={param.name}
                        className="break-words text-[var(--text-caption)] leading-[var(--leading-normal)]"
                      >
                        <span className="font-[var(--font-mono)] font-medium text-[var(--ink)]">
                          {param.name}
                        </span>
                        <span className="ml-[var(--space-1)] text-[var(--ink-tertiary)]">
                          ({param.type})
                        </span>
                        {param.description ? (
                          <span className="ml-[var(--space-1)] text-[var(--ink-tertiary)]">
                            — {param.description}
                          </span>
                        ) : null}
                        {param.default !== undefined ? (
                          <span className="ml-[var(--space-1)] text-[var(--ink-ghost)]">
                            default: {param.default}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </DetailSection>
              ) : null}

              {skill.outputs.length > 0 ? (
                <DetailSection label="Outputs">
                  <div className="space-y-[var(--space-1)]">
                    {skill.outputs.map((output, index) => (
                      <div
                        key={`${output.type}-${index}`}
                        className="break-words text-[var(--text-caption)] leading-[var(--leading-normal)]"
                      >
                        <span className="font-[var(--font-mono)] font-medium text-[var(--ink)]">
                          {output.type}
                        </span>
                        {output.description ? (
                          <span className="ml-[var(--space-1)] text-[var(--ink-tertiary)]">
                            — {output.description}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </DetailSection>
              ) : null}

              {skill.requiredTools.length === 0 &&
              skill.inputParams.length === 0 &&
              skill.outputs.length === 0 ? (
                <p className="text-[var(--text-caption)] text-[var(--ink-tertiary)]">
                  No additional details available.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
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

function DetailSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[var(--space-1)]">
      <p className="text-[var(--text-micro)] font-medium uppercase tracking-[var(--tracking-wide)] text-[var(--ink-ghost)]">
        {label}
      </p>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-[var(--space-2)] py-[var(--space-12)] text-center">
      <Icon icon="solar:widget-outline" width={32} className="text-[var(--ink-ghost)]" />
      <p className="text-[var(--text-body-sm)] font-medium text-[var(--ink-secondary)]">
        No skills installed
      </p>
      <p className="text-[var(--text-caption)] text-[var(--ink-ghost)]">
        Drag a .skill.md file onto the app or click Import.
      </p>
    </div>
  );
}
