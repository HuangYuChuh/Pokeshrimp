"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppState, useAppDispatch, type PreviewTab } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Tabs, TextArea, Button, Chip } from "@heroui/react";
import { ZoomIn, ZoomOut, Maximize, Music, RefreshCw, Pencil, Columns } from "lucide-react";
import { DesignfileGraph } from "@/components/designfile-graph";

interface PreviewPanelProps {
  open: boolean;
  onToggle: () => void;
}

export function PreviewPanel({ open }: PreviewPanelProps) {
  const { previewTab, previewContent, previousPreview, editorParams, outputFiles } =
    useAppState();
  const dispatch = useAppDispatch();

  const handleTabChange = useCallback(
    (key: React.Key) => {
      dispatch({ type: "SET_PREVIEW_TAB", tab: key as PreviewTab });
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
        "flex h-screen shrink-0 flex-col border-l border-border bg-surface-secondary overflow-hidden transition-all duration-200",
        open ? "w-[380px] min-w-[380px]" : "w-0 min-w-0 border-l-0",
      )}
    >
      {/* macOS traffic light spacer */}
      <div className="drag h-13 shrink-0" />

      <Tabs
        selectedKey={previewTab}
        onSelectionChange={handleTabChange}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <Tabs.List className="mx-4 shrink-0">
          <Tabs.Tab id="preview">Preview</Tabs.Tab>
          <Tabs.Tab id="editor">Editor</Tabs.Tab>
          <Tabs.Tab id="output">Output</Tabs.Tab>
          <Tabs.Tab id="designfile">Designfile</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel id="preview" className="flex-1 overflow-hidden">
          <PreviewContent
            content={previewContent}
            previousPreview={previousPreview}
            onRerun={() => dispatch({ type: "REQUEST_RERUN" })}
            onEditRerun={() => dispatch({ type: "SET_PREVIEW_TAB", tab: "editor" })}
          />
        </Tabs.Panel>

        <Tabs.Panel id="editor" className="flex-1 overflow-hidden">
          <EditorContent value={editorParams} onChange={handleEditorChange} />
        </Tabs.Panel>

        <Tabs.Panel id="output" className="flex-1 overflow-hidden">
          <OutputContent files={outputFiles} />
        </Tabs.Panel>

        <Tabs.Panel id="designfile" className="flex-1 overflow-hidden">
          <DesignfileGraph />
        </Tabs.Panel>
      </Tabs>
    </aside>
  );
}

// --- Media type detection ---

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

// --- Zoom constants ---

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

// --- Preview tab content ---

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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [comparing, setComparing] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const prevUrl = useRef(content.url);

  // Reset zoom/pan when a new image loads
  useEffect(() => {
    if (content.url !== prevUrl.current) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      prevUrl.current = content.url;
    }
  }, [content.url]);

  const clampZoom = useCallback(
    (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)),
    [],
  );

  const handleZoomIn = useCallback(() => {
    setZoom((z) => clampZoom(z + ZOOM_STEP));
  }, [clampZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => clampZoom(z - ZOOM_STEP));
  }, [clampZoom]);

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

  // Resolve effective media type: explicit type or detect from URL extension
  const effectiveType =
    content.type === "video" || content.type === "audio"
      ? content.type
      : content.url
        ? getMediaType(content.url)
        : content.type;

  // Video
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

  // Audio
  if (effectiveType === "audio" && content.url) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <Music size={15} strokeWidth={1.5} className="h-10 w-10 text-muted" />
        </div>
        <audio
          key={content.url}
          controls
          preload="metadata"
          className="w-full max-w-xs"
        >
          <source src={content.url} />
        </audio>
      </div>
    );
  }

  // Image with zoom/pan
  if (content.type === "image" && content.url) {
    const hasComparison = !!(previousPreview?.url && previousPreview.url !== content.url);

    return (
      <div className="flex h-full flex-col">
        {/* Zoom toolbar */}
        <div className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-1.5">
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={handleZoomOut}
          >
            <ZoomOut size={15} strokeWidth={1.5} />
          </Button>
          <span className="min-w-[3.5rem] text-center text-[12px] tabular-nums text-muted">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={handleZoomIn}
          >
            <ZoomIn size={15} strokeWidth={1.5} />
          </Button>
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={handleReset}
          >
            <Maximize size={15} strokeWidth={1.5} />
          </Button>
          {hasComparison && (
            <>
              <div className="mx-1 h-4 w-px bg-border" />
              <Button
                isIconOnly
                variant={comparing ? "secondary" : "ghost"}
                size="sm"
                onPress={() => setComparing((v) => !v)}
              >
                <Columns size={15} strokeWidth={1.5} />
              </Button>
            </>
          )}
        </div>

        {/* Compare view */}
        {comparing && hasComparison ? (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 items-center justify-center overflow-hidden border-r border-border p-2">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[11px] font-medium text-muted">Before</span>
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
                <span className="text-[11px] font-medium text-muted">After</span>
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
          /* Normal image viewport */
          <div
            ref={containerRef}
            className="flex flex-1 items-center justify-center overflow-hidden"
            style={{
              cursor:
                zoom > 1
                  ? isDragging.current
                    ? "grabbing"
                    : "grab"
                  : "default",
            }}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
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

        {/* Re-run action bar */}
        <div className="flex shrink-0 items-center justify-center gap-2 border-t border-border px-3 py-2">
          <Button variant="ghost" size="sm" onPress={onRerun}>
            <RefreshCw size={15} strokeWidth={2} className="mr-1.5" />
            Re-run
          </Button>
          <Button variant="ghost" size="sm" onPress={onEditRerun}>
            <Pencil size={15} strokeWidth={2} className="mr-1.5" />
            Edit & Re-run
          </Button>
        </div>
      </div>
    );
  }

  // Text
  if (content.type === "text" && content.text) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="selectable whitespace-pre-wrap p-5 text-[14px] leading-7 text-foreground">
          {content.text}
        </div>
      </div>
    );
  }

  // Empty state
  return (
    <div className="flex h-full items-center justify-center text-[13px] text-muted">
      Generated content will appear here
    </div>
  );
}

// --- Editor tab content ---

function EditorContent({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex h-full flex-col p-4">
      <label className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
        Parameters
      </label>
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        fullWidth
        className="selectable flex-1 resize-none font-mono text-xs"
        placeholder='{ "prompt": "..." }'
      />
    </div>
  );
}

// --- Output tab content ---

function OutputContent({
  files,
}: {
  files: { name: string; path: string; type: string }[];
}) {
  if (files.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-muted">
        Output files will appear here
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-1 p-4">
        {files.map((file, i) => (
          <Button
            key={i}
            variant="ghost"
            fullWidth
            className="justify-start gap-2.5"
          >
            <Chip size="sm" variant="soft" className="font-mono">
              {file.type}
            </Chip>
            <span className="flex-1 truncate text-[13px] text-foreground">
              {file.name}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
