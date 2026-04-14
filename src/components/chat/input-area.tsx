"use client";

import { forwardRef, useState, useRef, useCallback, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { ArrowUp, Paperclip, X, FileIcon, Slash } from "lucide-react";
import { MODEL_OPTIONS } from "@/core/ai/provider";
import { Button, Card, Select, ListBox, TextArea } from "@heroui/react";

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
  modelLabel: string;
  modelId: string;
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
    modelLabel,
    modelId,
    skills,
    onModelChange,
    onChange,
    onKeyDown,
    onSubmit,
    onSelectSkill,
  },
  ref,
) {
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Slash command popup
  const slashQuery =
    input.startsWith("/") && !input.includes(" ") ? input.slice(1).toLowerCase() : null;
  const filteredSkills =
    slashQuery !== null
      ? skills.filter(
          (s) =>
            s.command.toLowerCase().includes(slashQuery) ||
            s.name.toLowerCase().includes(slashQuery),
        )
      : [];
  const isSlashMode = slashQuery !== null && filteredSkills.length > 0;

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
    [attachments, input, isLoading, onKeyDown, handleFormSubmit],
  );

  return (
    <div className="shrink-0 px-3 pb-4 sm:px-6 sm:pb-6">
      <form onSubmit={handleFormSubmit} className="relative mx-auto max-w-[680px]">
        {/* Slash command popup */}
        {isSlashMode && (
          <Card className="absolute bottom-full left-0 z-10 mb-2 w-full p-1">
            {filteredSkills.map((skill) => (
              <button
                key={skill.command}
                type="button"
                className="nodrag flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent"
                onClick={() => onSelectSkill(skill.command)}
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-muted">
                  <Slash size={11} strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground">{skill.command}</div>
                  <div className="truncate text-[12px] text-muted">{skill.description}</div>
                </div>
              </button>
            ))}
          </Card>
        )}

        <Card
          className={cn(
            "overflow-hidden transition-colors",
            isDragOver && "border-primary bg-primary/5",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Card.Content className="p-0">
            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pt-3">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="group/att relative flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5"
                  >
                    {att.previewUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={att.previewUrl}
                        alt={att.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                        <FileIcon size={16} className="text-muted" />
                      </div>
                    )}
                    <div className="min-w-0 max-w-[120px]">
                      <div className="truncate text-[12px] font-medium text-foreground">
                        {att.name}
                      </div>
                      <div className="text-[11px] text-muted">{formatFileSize(att.size)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      className="nodrag absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-background opacity-0 transition-opacity group-hover/att:opacity-100"
                    >
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <TextArea
              ref={ref}
              value={input}
              onChange={onChange}
              onKeyDown={handleKeyDownWithAttachments}
              placeholder="Describe what you want to create, type / for skills..."
              rows={1}
              disabled={isLoading}
              variant="secondary"
              className="selectable nodrag block w-full resize-none border-none px-4 pb-2 pt-4 text-[14px] leading-6 shadow-none focus:outline-none disabled:opacity-50"
            />

            <div className="flex items-center justify-between px-3 pb-2.5">
              <div className="flex items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_TYPES}
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  onPress={() => fileInputRef.current?.click()}
                  isDisabled={isLoading}
                  className="nodrag h-7 w-7 min-w-0"
                  aria-label="Attach files"
                >
                  <Paperclip size={15} strokeWidth={1.5} />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  aria-label="Model selection"
                  selectedKey={modelId}
                  onSelectionChange={(key) => {
                    if (key) onModelChange(String(key));
                  }}
                  className="nodrag w-auto min-w-0"
                >
                  <Select.Trigger className="flex h-7 items-center gap-1 rounded-lg border-none bg-transparent px-2 text-[12px] text-muted shadow-none transition-colors hover:bg-muted hover:text-foreground">
                    <Select.Value>{modelLabel}</Select.Value>
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox className="text-[13px]">
                      {MODEL_OPTIONS.map((m) => (
                        <ListBox.Item key={m.id} id={m.id}>
                          {m.label}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
                <Button
                  isIconOnly
                  variant="primary"
                  size="sm"
                  type="submit"
                  isDisabled={(!input.trim() && attachments.length === 0) || isLoading}
                  className="nodrag h-7 w-7 min-w-0"
                >
                  <ArrowUp size={15} strokeWidth={2} />
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>
      </form>
    </div>
  );
});
