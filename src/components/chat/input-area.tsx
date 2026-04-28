"use client";

import {
  forwardRef,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { useT } from "@/lib/i18n";
import { Button, Card, Select } from "@/design-system/components";

/* --- Skill type --- */

export interface SkillInfo {
  name: string;
  command: string;
  description: string;
}

/* --- Attachment helpers --- */

interface LocalAttachment {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
}

function isImageType(mimeType: string) {
  return mimeType.startsWith("image/");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let attachmentIdCounter = 0;
function createLocalAttachment(file: File): LocalAttachment {
  const id = `att-${++attachmentIdCounter}-${Date.now()}`;
  return {
    id,
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    previewUrl: isImageType(file.type) ? URL.createObjectURL(file) : undefined,
  };
}

const ACCEPTED_TYPES =
  "image/*,.pdf,.txt,.md,.json,.csv,.svg,.html,.css,.js,.ts,.tsx,.jsx,.yaml,.yml,.xml,.log,.sh,.py,.zip";

/* --- Props --- */

interface InputAreaProps {
  input: string;
  isLoading: boolean;
  modelId: string;
  modelOptions: { value: string; label: string }[];
  skills: SkillInfo[];
  onModelChange: (id: string) => void;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    options?: { experimental_attachments?: FileList },
  ) => void;
  onSelectSkill: (command: string) => void;
}

export const InputArea = forwardRef<HTMLTextAreaElement, InputAreaProps>(function InputArea(
  {
    input,
    isLoading,
    modelId,
    modelOptions,
    skills,
    onModelChange,
    onChange,
    onKeyDown,
    onSubmit,
    onSelectSkill,
  },
  ref,
) {
  const t = useT();
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Slash command popup
  const slashQuery =
    input.startsWith("/") && !input.includes(" ") ? input.slice(1).toLowerCase() : null;
  const filteredSkills = useMemo(
    () =>
      slashQuery !== null
        ? skills.filter(
            (s) =>
              s.command.toLowerCase().includes(slashQuery) ||
              s.name.toLowerCase().includes(slashQuery),
          )
        : [],
    [slashQuery, skills],
  );
  const isSlashMode = slashQuery !== null;
  const [slashIndex, setSlashIndex] = useState(0);

  // Reset highlight when results change
  useEffect(() => {
    setSlashIndex(0);
  }, [filteredSkills.length]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newAttachments = Array.from(files).map(createLocalAttachment);
    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const removed = prev.find((a) => a.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      e.target.value = "";
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if ((!input.trim() && attachments.length === 0) || isLoading) return;
      let fileList: FileList | undefined;
      if (attachments.length > 0) {
        const dt = new DataTransfer();
        for (const a of attachments) dt.items.add(a.file);
        fileList = dt.files;
      }
      for (const a of attachments) {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      }
      setAttachments([]);
      onSubmit(e, fileList ? { experimental_attachments: fileList } : undefined);
    },
    [input, attachments, isLoading, onSubmit],
  );

  const handleKeyDownWithAttachments = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Slash command keyboard navigation
      if (isSlashMode && filteredSkills.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSlashIndex((i) => (i + 1) % filteredSkills.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSlashIndex((i) => (i - 1 + filteredSkills.length) % filteredSkills.length);
          return;
        }
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSelectSkill(filteredSkills[slashIndex].command);
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          // Clear slash input to close popup
          return;
        }
      }

      if (e.key === "Enter" && !e.shiftKey) {
        if (attachments.length > 0 && !input.trim() && !isLoading) {
          e.preventDefault();
          const syntheticEvent = {
            preventDefault: () => {},
          } as React.FormEvent<HTMLFormElement>;
          handleFormSubmit(syntheticEvent);
          return;
        }
      }
      onKeyDown(e);
    },
    [
      attachments,
      input,
      isLoading,
      onKeyDown,
      handleFormSubmit,
      isSlashMode,
      filteredSkills,
      slashIndex,
      onSelectSkill,
    ],
  );

  // modelOptions comes from props (dynamically loaded from user's provider config)

  return (
    <div className="shrink-0 px-[var(--space-4)] pb-[18px] pt-[var(--space-3)]">
      <form onSubmit={handleFormSubmit} className="relative mx-auto max-w-[var(--width-chat)]">
        {/* Slash command popup */}
        {isSlashMode && (
          <Card className="absolute bottom-full left-0 z-10 mb-[var(--space-2)] w-full p-[var(--space-1)] max-h-[240px] overflow-y-auto">
            {filteredSkills.length > 0 ? (
              filteredSkills.map((skill, i) => (
                <button
                  key={skill.command}
                  type="button"
                  className={cn(
                    "nodrag flex w-full items-start gap-[var(--space-3)] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)] text-left transition-colors",
                    i === slashIndex
                      ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                      : "hover:bg-[var(--border-subtle)]",
                  )}
                  onClick={() => onSelectSkill(skill.command)}
                  onMouseEnter={() => setSlashIndex(i)}
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--border-subtle)] text-[var(--ink-tertiary)]">
                    <Icon icon="solar:slash-circle-outline" width={11} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[var(--text-body-sm)] font-medium text-[var(--ink)]">
                      {skill.command}
                    </div>
                    <div className="truncate text-[var(--text-caption)] text-[var(--ink-tertiary)]">
                      {skill.description}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-[var(--space-3)] py-[var(--space-4)] text-center text-[var(--text-body-sm)] text-[var(--ink-tertiary)]">
                {t.noSkillsMatch} &ldquo;/{slashQuery}&rdquo;
              </div>
            )}
          </Card>
        )}

        {/* Composer card */}
        <div
          className={cn(
            "rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] px-[var(--space-3)] pb-[var(--space-2)] pt-[10px] transition-colors",
            isDragOver && "border-[var(--accent)] bg-[var(--accent-subtle)]",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-[var(--space-2)] px-[var(--space-1)] pb-[var(--space-2)]">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="group/att relative flex items-center gap-[var(--space-2)] rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--border-subtle)] px-[var(--space-3)] py-1.5"
                >
                  {att.previewUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      className="h-10 w-10 rounded-[var(--radius-sm)] object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--border-subtle)]">
                      <Icon
                        icon="solar:file-outline"
                        width={16}
                        className="text-[var(--ink-tertiary)]"
                      />
                    </div>
                  )}
                  <div className="min-w-0 max-w-[120px]">
                    <div className="truncate text-[var(--text-caption)] font-medium text-[var(--ink)]">
                      {att.name}
                    </div>
                    <div className="text-[var(--text-micro)] text-[var(--ink-tertiary)]">
                      {formatFileSize(att.size)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="nodrag absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--ink)] text-[var(--canvas)] opacity-0 transition-opacity group-hover/att:opacity-100"
                  >
                    <Icon icon="solar:close-circle-outline" width={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={ref}
            value={input}
            onChange={onChange}
            onKeyDown={handleKeyDownWithAttachments}
            placeholder={t.inputPlaceholder}
            rows={1}
            disabled={isLoading}
            className="selectable nodrag block w-full resize-none border-none bg-transparent px-[var(--space-1)] py-0 font-[family-name:var(--font-sans)] text-[var(--text-body)] leading-[var(--leading-normal)] text-[var(--ink)] shadow-none min-h-[56px] placeholder:text-[var(--ink-ghost)] focus:outline-none focus:ring-0 disabled:opacity-50"
          />

          {/* Bottom toolbar */}
          <div className="flex items-center gap-[6px]">
            {/* Left group */}
            <div className="flex items-center gap-[6px]">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ACCEPTED_TYPES}
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Paperclip */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="nodrag flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-transparent text-[var(--ink-secondary)] transition-colors hover:bg-[var(--border-subtle)] disabled:opacity-50 disabled:pointer-events-none"
                aria-label={t.attachFiles}
              >
                <Icon icon="solar:paperclip-outline" width={15} />
              </button>

              {/* Skills button */}
              <button
                type="button"
                onClick={() => onSelectSkill("/")}
                disabled={isLoading}
                className="nodrag flex h-7 w-auto items-center gap-[var(--space-1)] rounded-[var(--radius-sm)] bg-transparent px-[var(--space-2)] text-[var(--ink-secondary)] transition-colors hover:bg-[var(--border-subtle)] disabled:opacity-50 disabled:pointer-events-none"
              >
                <Icon icon="solar:slash-circle-outline" width={13} />
                <span className="font-[family-name:var(--font-mono)] text-[var(--text-micro)] text-[var(--ink-secondary)]">
                  {t.skills.toLowerCase()}
                </span>
              </button>
            </div>

            {/* Right group */}
            <div className="ml-auto flex items-center gap-[6px]">
              {/* Model selector (styled as plain text) */}
              <div className="relative min-w-[60px]">
                <Select
                  value={modelOptions.some((o) => o.value === modelId) ? modelId : undefined}
                  onChange={onModelChange}
                  options={modelOptions}
                  placeholder="model..."
                  className="nodrag !h-auto !w-auto !border-none !bg-transparent !p-0 !shadow-none !ring-0 !outline-none [&>span]:font-[family-name:var(--font-mono)] [&>span]:text-[10px] [&>span]:text-[var(--ink-ghost)] [&>svg]:hidden"
                />
              </div>

              {/* Shortcut hint */}
              <span className="select-none font-[family-name:var(--font-mono)] text-[10px] text-[var(--ink-ghost)]">
                ·&nbsp;&#x2318;&#x21B5;
              </span>

              {/* Send */}
              <Button
                variant="primary"
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isLoading || !modelId}
                className="nodrag !h-7 !w-7 !rounded-[var(--radius-md)] !p-0"
              >
                <Icon icon="solar:arrow-up-outline" width={15} />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
});
