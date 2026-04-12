"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AppProvider, useAppDispatch } from "@/lib/store";
import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { PreviewPanel } from "@/components/preview-panel";
import { SettingsDialog } from "@/components/settings-dialog";
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

  return (
    <>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
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
