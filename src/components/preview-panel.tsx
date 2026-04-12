"use client";

import { useCallback } from "react";
import { useAppState, useAppDispatch, type PreviewTab } from "@/lib/store";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

export function PreviewPanel() {
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
    <aside className="flex h-screen w-[380px] min-w-[380px] flex-col border-l border-border bg-sidebar">
      {/* Navbar spacer */}
      <div className="drag h-12 shrink-0" />

      <Tabs
        value={previewTab}
        onValueChange={handleTabChange}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <TabsList className="mx-4 shrink-0">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="flex-1 overflow-auto">
          <PreviewContent content={previewContent} />
        </TabsContent>

        <TabsContent value="editor" className="flex-1 overflow-auto">
          <EditorContent value={editorParams} onChange={handleEditorChange} />
        </TabsContent>

        <TabsContent value="output" className="flex-1 overflow-auto">
          <OutputContent files={outputFiles} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function PreviewContent({
  content,
}: {
  content: { type: string; url?: string; text?: string };
}) {
  if (content.type === "image" && content.url) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <img
          src={content.url}
          alt="Preview"
          className="max-h-full max-w-full rounded-lg object-contain"
        />
      </div>
    );
  }
  if (content.type === "text" && content.text) {
    return (
      <ScrollArea className="h-full">
        <div className="selectable whitespace-pre-wrap p-5 text-sm leading-relaxed text-foreground">
          {content.text}
        </div>
      </ScrollArea>
    );
  }
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Generated content will appear here
    </div>
  );
}

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

function OutputContent({
  files,
}: {
  files: { name: string; path: string; type: string }[];
}) {
  if (files.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
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
            className="mb-0.5 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {file.type}
            </span>
            <span className="flex-1 truncate text-sm text-foreground">
              {file.name}
            </span>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
