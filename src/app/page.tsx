"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AppProvider, useAppDispatch } from "@/lib/store";
import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { PreviewPanel } from "@/components/preview-panel";
import { SettingsDialog } from "@/components/settings-dialog";
import { SkillsManager } from "@/components/skills-manager";
import { SkillDropOverlay } from "@/components/skill-drop-overlay";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Constants
 * --------------------------------------------------------------------------- */

const SIDEBAR_KEY = "pokeshrimp:sidebar-open";
const PREVIEW_KEY = "pokeshrimp:preview-open";

/* ---------------------------------------------------------------------------
 * Hooks
 * --------------------------------------------------------------------------- */

/** Subscribe to a CSS media query and return whether it currently matches. */
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

/* ---------------------------------------------------------------------------
 * Main layout orchestrator
 * --------------------------------------------------------------------------- */

function HomeInner() {
  const [modelId, setModelId] = useState("claude-sonnet");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const dispatch = useAppDispatch();

  /* --- Responsive breakpoints ------------------------------------------- */
  const isAbove1200 = useMediaQuery("(min-width: 1200px)");
  const isAbove1000 = useMediaQuery("(min-width: 1000px)");

  /* --- Panel visibility (user override OR responsive default) ------------ */
  const [sidebarOverride, setSidebarOverride] = useState<boolean | null>(null);
  const [previewOverride, setPreviewOverride] = useState<boolean | null>(null);

  // Restore persisted panel state on mount
  useEffect(() => {
    try {
      const s = localStorage.getItem(SIDEBAR_KEY);
      if (s !== null) setSidebarOverride(JSON.parse(s));
      const p = localStorage.getItem(PREVIEW_KEY);
      if (p !== null) setPreviewOverride(JSON.parse(p));
    } catch {
      /* ignore */
    }
  }, []);

  const sidebarOpen = sidebarOverride ?? isAbove1200;
  const previewOpen = previewOverride ?? isAbove1000;

  const toggleSidebar = useCallback(() => {
    setSidebarOverride((prev) => {
      const next = !(prev ?? isAbove1200);
      try {
        localStorage.setItem(SIDEBAR_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [isAbove1200]);

  const togglePreview = useCallback(() => {
    setPreviewOverride((prev) => {
      const next = !(prev ?? isAbove1000);
      try {
        localStorage.setItem(PREVIEW_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [isAbove1000]);

  // Reset overrides when crossing responsive breakpoints
  useEffect(() => {
    setSidebarOverride(null);
  }, [isAbove1200]);
  useEffect(() => {
    setPreviewOverride(null);
  }, [isAbove1000]);

  /* --- Session management ----------------------------------------------- */
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

  /* --- Keyboard shortcuts ----------------------------------------------- */
  useKeyboardShortcuts({
    onNewSession: handleNewSession,
    onFocusChatInput: useCallback(() => {
      chatInputRef.current?.focus();
    }, []),
    onOpenSettings: useCallback(() => setSettingsOpen(true), []),
    onCloseSettings: useCallback(() => setSettingsOpen(false), []),
    isSettingsOpen: settingsOpen,
  });

  /* --- Drag-and-drop skill import --------------------------------------- */
  const [dragOver, setDragOver] = useState(false);
  const [dropToast, setDropToast] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);
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

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
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
    },
    [showToast],
  );

  /* --- Render ----------------------------------------------------------- */
  return (
    <>
      {/* Three-panel layout: sidebar (260px) + chat (flex-1) + preview (380px) */}
      <div
        className="flex h-screen w-screen overflow-hidden bg-background"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Left: Sidebar */}
        <Sidebar
          open={sidebarOpen}
          onToggle={toggleSidebar}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenSkills={() => setSkillsOpen(true)}
        />

        {/* Center: Chat panel */}
        <ChatPanel
          modelId={modelId}
          onModelChange={setModelId}
          inputRef={chatInputRef}
          sidebarOpen={sidebarOpen}
          previewOpen={previewOpen}
          onToggleSidebar={toggleSidebar}
          onTogglePreview={togglePreview}
        />

        {/* Right: Preview panel */}
        <PreviewPanel open={previewOpen} onToggle={togglePreview} />

        {/* Skill drag-and-drop overlay */}
        <SkillDropOverlay visible={dragOver} />

        {/* Drop result toast */}
        {dropToast && (
          <div
            className={cn(
              "fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-lg px-4 py-2.5 text-[13px] font-medium shadow-lg transition-opacity duration-300",
              dropToast.isError
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground",
            )}
          >
            {dropToast.message}
          </div>
        )}
      </div>

      {/* Settings dialog (rendered outside layout to overlay everything) */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <SkillsManager
        open={skillsOpen}
        onClose={() => setSkillsOpen(false)}
      />
    </>
  );
}

/* ---------------------------------------------------------------------------
 * Page entry — wraps in AppProvider
 * --------------------------------------------------------------------------- */

export default function Home() {
  return (
    <AppProvider>
      <HomeInner />
    </AppProvider>
  );
}
