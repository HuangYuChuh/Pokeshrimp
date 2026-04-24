"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppState, useAppDispatch, type PreviewTab } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { useT } from "@/lib/i18n";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Textarea,
  Button,
  Chip,
} from "@/design-system/components";
import { DesignfileGraph } from "@/components/designfile-graph";

interface PreviewPanelProps {
  open: boolean;
}

export function PreviewPanel({ open }: PreviewPanelProps) {
  const t = useT();
  const { previewTab, previewContent, previousPreview, editorParams, outputFiles } = useAppState();
  const dispatch = useAppDispatch();

  const handleTabChange = useCallback(
    (value: string) => {
      dispatch({ type: "SET_PREVIEW_TAB", tab: value as PreviewTab });
    },
    [dispatch],
  );

  const handleEditorChange = useCallback(
    (value: string) => {
      dispatch({ type: "SET_EDITOR_PARAMS", params: value });
    },
    [dispatch],
  );

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-l border-[var(--border)] bg-[var(--canvas-subtle)] overflow-hidden transition-all duration-[var(--duration-normal)] ease-[var(--ease-out)]",
        open ? "w-[var(--width-preview)] min-w-[var(--width-preview)]" : "w-0 min-w-0 border-l-0",
      )}
    >
      <div className="drag h-[var(--height-titlebar)] shrink-0" />

      <Tabs
        value={previewTab}
        onValueChange={handleTabChange}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <TabsList className="mx-[var(--space-4)] shrink-0">
          <TabsTrigger value="preview">{t.preview}</TabsTrigger>
          <TabsTrigger value="editor">{t.editor}</TabsTrigger>
          <TabsTrigger value="output">{t.output}</TabsTrigger>
          <TabsTrigger value="designfile">{t.designfile}</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="flex-1 overflow-hidden mt-0">
          <PreviewContent
            content={previewContent}
            previousPreview={previousPreview}
            onRerun={() => dispatch({ type: "REQUEST_RERUN" })}
            onEditRerun={() => dispatch({ type: "SET_PREVIEW_TAB", tab: "editor" })}
          />
        </TabsContent>

        <TabsContent value="editor" className="flex-1 overflow-hidden mt-0">
          <EditorContent value={editorParams} onChange={handleEditorChange} />
        </TabsContent>

        <TabsContent value="output" className="flex-1 overflow-hidden mt-0">
          <OutputContent files={outputFiles} />
        </TabsContent>

        <TabsContent value="designfile" className="flex-1 overflow-hidden mt-0">
          <DesignfileGraph />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

const VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "avi", "mkv"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "flac", "ogg"];
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"];

function getMediaType(url: string): "image" | "video" | "audio" | "unknown" {
  const ext = url.split(".").pop()?.toLowerCase();
  if (ext && VIDEO_EXTENSIONS.includes(ext)) return "video";
  if (ext && AUDIO_EXTENSIONS.includes(ext)) return "audio";
  if (ext && IMAGE_EXTENSIONS.includes(ext)) return "image";
  return "unknown";
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

function PreviewContent({
  content,
  previousPreview,
  onRerun,
  onEditRerun,
}: {
  content: { type: string; url?: string; text?: string };
  previousPreview: { type: string; url?: string; text?: string } | null;
  onRerun: () => void;
  onEditRerun: () => void;
}) {
  const t = useT();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [comparing, setComparing] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const prevUrl = useRef(content.url);

  useEffect(() => {
    if (content.url !== prevUrl.current) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      prevUrl.current = content.url;
    }
  }, [content.url]);

  const clampZoom = useCallback((z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)), []);
  const handleZoomIn = useCallback(() => setZoom((z) => clampZoom(z + ZOOM_STEP)), [clampZoom]);
  const handleZoomOut = useCallback(() => setZoom((z) => clampZoom(z - ZOOM_STEP)), [clampZoom]);
  const handleReset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setZoom((z) => clampZoom(z + delta));
      }
    },
    [clampZoom],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (zoom <= 1) return;
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [zoom, pan],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    setPan({
      x: panStart.current.x + (e.clientX - dragStart.current.x),
      y: panStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const effectiveType =
    content.type === "video" || content.type === "audio"
      ? content.type
      : content.url
        ? getMediaType(content.url)
        : content.type;

  if (effectiveType === "video" && content.url) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <video
          key={content.url}
          controls
          preload="metadata"
          className="max-h-full max-w-full object-contain"
        >
          <source src={content.url} />
        </video>
      </div>
    );
  }

  if (effectiveType === "audio" && content.url) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--border-subtle)]">
          <Icon icon="solar:music-note-outline" width={40} className="text-[var(--ink-tertiary)]" />
        </div>
        <audio key={content.url} controls preload="metadata" className="w-full max-w-xs">
          <source src={content.url} />
        </audio>
      </div>
    );
  }

  if (content.type === "image" && content.url) {
    const hasComparison = !!(previousPreview?.url && previousPreview.url !== content.url);

    return (
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center gap-[var(--space-1)] border-b border-[var(--border)] px-[var(--space-3)] py-[var(--space-2)]">
          <Button variant="ghost" size="icon-sm" onClick={handleZoomOut} aria-label={t.zoomOut}>
            <Icon icon="solar:magnifer-zoom-out-outline" width={15} />
          </Button>
          <span className="min-w-[3.5rem] text-center text-[var(--text-caption)] tabular-nums text-[var(--ink-secondary)]">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon-sm" onClick={handleZoomIn} aria-label={t.zoomIn}>
            <Icon icon="solar:magnifer-zoom-in-outline" width={15} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleReset} aria-label={t.resetZoom}>
            <Icon icon="solar:maximize-square-outline" width={15} />
          </Button>
          {hasComparison && (
            <>
              <div className="mx-1 h-4 w-px bg-[var(--border)]" />
              <Button
                variant={comparing ? "outline" : "ghost"}
                size="icon-sm"
                onClick={() => setComparing((v) => !v)}
                aria-label={t.compare}
              >
                <Icon icon="solar:tuning-2-outline" width={15} />
              </Button>
            </>
          )}
        </div>

        {comparing && hasComparison ? (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 items-center justify-center overflow-hidden border-r border-[var(--border)] p-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[var(--text-micro)] font-medium text-[var(--ink-secondary)]">
                  {t.before}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previousPreview!.url}
                  alt="Before"
                  draggable={false}
                  className="max-h-full max-w-full select-none object-contain"
                />
              </div>
            </div>
            <div className="flex flex-1 items-center justify-center overflow-hidden p-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[var(--text-micro)] font-medium text-[var(--ink-secondary)]">
                  {t.after}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={content.url}
                  alt="After"
                  draggable={false}
                  className="max-h-full max-w-full select-none object-contain"
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="flex flex-1 items-center justify-center overflow-hidden"
            style={{ cursor: zoom > 1 ? (isDragging.current ? "grabbing" : "grab") : "default" }}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.url}
              alt="Preview"
              draggable={false}
              className="max-h-full max-w-full select-none object-contain"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center center",
              }}
            />
          </div>
        )}

        <div className="flex shrink-0 items-center justify-center gap-[var(--gap-inline)] border-t border-[var(--border)] px-[var(--space-3)] py-[var(--space-2)]">
          <Button variant="ghost" size="sm" onClick={onRerun}>
            <Icon icon="solar:refresh-outline" width={15} className="mr-1.5" />
            {t.reRun}
          </Button>
          <Button variant="ghost" size="sm" onClick={onEditRerun}>
            <Icon icon="solar:pen-outline" width={15} className="mr-1.5" />
            {t.editAndReRun}
          </Button>
        </div>
      </div>
    );
  }

  if (content.type === "text" && content.text) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="selectable whitespace-pre-wrap p-5 text-[var(--text-body)] leading-[var(--leading-relaxed)] text-[var(--ink)]">
          {content.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center text-[var(--text-body-sm)] text-[var(--ink-tertiary)]">
      {t.generatedContent}
    </div>
  );
}

function EditorContent({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useT();
  return (
    <div className="flex h-full flex-col p-4">
      <label className="mb-2 text-[var(--text-micro)] font-medium uppercase tracking-wider text-[var(--ink-ghost)]">
        {t.parameters}
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="selectable flex-1 resize-none font-[var(--font-mono)] text-[var(--text-caption)] w-full"
        placeholder='{ "prompt": "..." }'
      />
    </div>
  );
}

function OutputContent({ files }: { files: { name: string; path: string; type: string }[] }) {
  const t = useT();
  if (files.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--text-body-sm)] text-[var(--ink-tertiary)]">
        {t.outputFiles}
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-1 p-4">
        {files.map((file, i) => (
          <Button key={i} variant="ghost" className="w-full justify-start gap-2.5">
            <Chip size="sm" className="font-[var(--font-mono)]">
              {file.type}
            </Chip>
            <span className="flex-1 truncate text-[var(--text-body-sm)] text-[var(--ink)]">
              {file.name}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
