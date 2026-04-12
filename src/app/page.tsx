"use client";

import { useState, useRef, useCallback } from "react";
import { AppProvider, useAppDispatch } from "@/lib/store";
import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { SettingsDialog } from "@/components/settings-dialog";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

function HomeInner() {
  const [modelId, setModelId] = useState("claude-sonnet");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const dispatch = useAppDispatch();

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
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
        <ChatPanel modelId={modelId} onModelChange={setModelId} inputRef={chatInputRef} />
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
