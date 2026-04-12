"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AppProvider, useAppDispatch } from "@/lib/store";
import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { PreviewPanel } from "@/components/preview-panel";
import { SettingsDialog } from "@/components/settings-dialog";
import { SkillDropOverlay } from "@/components/skill-drop-overlay";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

const SIDEBAR_KEY = "pokeshrimp:sidebar-open";
const PREVIEW_KEY = "pokeshrimp:preview-open";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

function HomeInner() {
  const [modelId, setModelId] = useState("claude-sonnet");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const dispatch = useAppDispatch();

  // Responsive breakpoints
  const isLg = useMediaQuery("(min-width: 1200px)");
  const isXl = useMediaQuery("(min-width: 1000px)");

  // Panel visibility: user override or responsive default
  const [sidebarOverride, setSidebarOverride] = useState<boolean | null>(null);
  const [previewOverride, setPreviewOverride] = useState<boolean | null>(null);

  // Load persisted state once
  useEffect(() => {
    try {
      const s = localStorage.getItem(SIDEBAR_KEY);
      if (s !== null) setSidebarOverride(JSON.parse(s));
      const p = localStorage.getItem(PREVIEW_KEY);
      if (p !== null) setPreviewOverride(JSON.parse(p));
    } catch {}
  }, []);

  const sidebarOpen = sidebarOverride ?? isLg;
  const previewOpen = previewOverride ?? isXl;

  const toggleSidebar = useCallback(() => {
    setSidebarOverride((prev) => {
      const next = !(prev ?? isLg);
      try { localStorage.setItem(SIDEBAR_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [isLg]);

  const togglePreview = useCallback(() => {
    setPreviewOverride((prev) => {
      const next = !(prev ?? isXl);
      try { localStorage.setItem(PREVIEW_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, [isXl]);

  // Reset overrides when crossing breakpoints so responsive defaults apply again
  useEffect(() => { setSidebarOverride(null); }, [isLg]);
  useEffect(() => { setPreviewOverride(null); }, [isXl]);

  const handleNewSession = useCallback(() => {
    const id = crypto.randomUUID();
    const session = {
      id,
      title: "New Task",
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_SESSION", session });
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(session),
    }).catch(() => {});
  }, [dispatch]);

  useKeyboardShortcuts({
    onNewSession: handleNewSession,
    onFocusChatInput: useCallback(() => {
      chatInputRef.current?.focus();
    }, []),
    onOpenSettings: useCallback(() => setSettingsOpen(true), []),
    onCloseSettings: useCallback(() => setSettingsOpen(false), []),
    isSettingsOpen: settingsOpen,
  });

  // --- Drag-and-drop skill import ---
  const [dragOver, setDragOver] = useState(false);
  const [dropToast, setDropToast] = useState<{ message: string; isError: boolean } | null>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const showToast = useCallback((message: string, isError: boolean) => {
    setDropToast({ message, isError });
    setTimeout(() => setDropToast(null), 3000);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const skillFiles = files.filter((f) => f.name.endsWith(".skill.md"));

    if (skillFiles.length === 0) {
      showToast("Only .skill.md files can be imported", true);
      return;
    }

    for (const file of skillFiles) {
      try {
        const content = await file.text();
        const res = await fetch("/api/skills/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, content }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Failed to import skill", true);
        } else {
          showToast(`Skill '${data.name}' installed`, false);
        }
      } catch {
        showToast(`Failed to import ${file.name}`, true);
      }
    }
  }, [showToast]);

  return (
    <>
      <div
        className="flex h-screen w-screen overflow-hidden bg-background"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Sidebar open={sidebarOpen} onToggle={toggleSidebar} onOpenSettings={() => setSettingsOpen(true)} />
        <ChatPanel
          modelId={modelId}
          onModelChange={setModelId}
          inputRef={chatInputRef}
          sidebarOpen={sidebarOpen}
          previewOpen={previewOpen}
          onToggleSidebar={toggleSidebar}
          onTogglePreview={togglePreview}
        />
        <PreviewPanel open={previewOpen} onToggle={togglePreview} />
        <SkillDropOverlay visible={dragOver} />
        {dropToast && (
          <div
            className={`fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg transition-opacity duration-300 ${
              dropToast.isError
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {dropToast.message}
          </div>
        )}
      </div>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <HomeInner />
    </AppProvider>
  );
}
