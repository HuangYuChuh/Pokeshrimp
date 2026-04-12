"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppState, useAppDispatch, type PreviewTab } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ZoomIn, ZoomOut, Maximize, Music } from "lucide-react";
import { DesignfileGraph } from "@/components/designfile-graph";

interface PreviewPanelProps {
  open: boolean;
  onToggle: () => void;
}

export function PreviewPanel({ open }: PreviewPanelProps) {
  const { previewTab, previewContent, editorParams, outputFiles } =
    useAppState();
  const dispatch = useAppDispatch();

  const handleTabChange = useCallback(
    (value: unknown) => {
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
        "flex h-screen shrink-0 flex-col border-l border-border bg-sidebar overflow-hidden transition-all duration-200",
        open ? "w-[380px] min-w-[380px]" : "w-0 min-w-0 border-l-0",
      )}
    >
      {/* macOS traffic light spacer */}
      <div className="drag h-13 shrink-0" />

      <Tabs
        value={previewTab}
        onValueChange={handleTabChange}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <TabsList className="mx-4 shrink-0">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
          <TabsTrigger value="designfile">Designfile</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="flex-1 overflow-hidden">
          <PreviewContent content={previewContent} />
        </TabsContent>

        <TabsContent value="editor" className="flex-1 overflow-hidden">
          <EditorContent value={editorParams} onChange={handleEditorChange} />
        </TabsContent>

        <TabsContent value="output" className="flex-1 overflow-hidden">
          <OutputContent files={outputFiles} />
        </TabsContent>

        <TabsContent value="designfile" className="flex-1 overflow-hidden">
          <DesignfileGraph />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

// ─── Media type detection ───────────────────────────────────

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

// ─── Zoom constants ─────────────────────────────────────────

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

// ─── Preview tab content ────────────────────────────────────

function PreviewContent({
  content,
}: {
  content: { type: string; url?: string; text?: string };
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
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
          <Music size={15} strokeWidth={1.5} className="h-10 w-10 text-muted-foreground" />
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
    return (
      <div className="flex h-full flex-col">
        {/* Zoom toolbar */}
        <div className="flex shrink-0 items-center gap-1 border-b border-border px-3 py-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            title="Zoom out"
          >
            <ZoomOut size={15} strokeWidth={1.5} />
          </button>
          <span className="min-w-[3.5rem] text-center text-[12px] tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            title="Zoom in"
          >
            <ZoomIn size={15} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            title="Reset zoom"
          >
            <Maximize size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Image viewport */}
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
      </div>
    );
  }

  // Text
  if (content.type === "text" && content.text) {
    return (
      <ScrollArea className="h-full">
        <div className="selectable whitespace-pre-wrap p-5 text-[14px] leading-7 text-foreground">
          {content.text}
        </div>
      </ScrollArea>
    );
  }

  // Empty state
  return (
    <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
      Generated content will appear here
    </div>
  );
}

// ─── Editor tab content ─────────────────────────────────────

function EditorContent({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex h-full flex-col p-4">
      <label className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Parameters
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="selectable flex-1 resize-none font-mono text-xs"
        placeholder='{ "prompt": "..." }'
      />
    </div>
  );
}

// ─── Output tab content ─────────────────────────────────────

function OutputContent({
  files,
}: {
  files: { name: string; path: string; type: string }[];
}) {
  if (files.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
        Output files will appear here
      </div>
    );
  }
  return (
    <ScrollArea className="h-full">
      <div className="p-4">
        {files.map((file, i) => (
          <button
            key={i}
            type="button"
            className="mb-0.5 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {file.type}
            </span>
            <span className="flex-1 truncate text-[13px] text-foreground">
              {file.name}
            </span>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
