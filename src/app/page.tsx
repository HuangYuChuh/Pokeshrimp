"use client";

import { useState } from "react";
import { AppProvider } from "@/lib/store";
import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { SettingsDialog } from "@/components/settings-dialog";

export default function Home() {
  const [modelId, setModelId] = useState("claude-sonnet");
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <AppProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
        <ChatPanel modelId={modelId} onModelChange={setModelId} />
      </div>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </AppProvider>
  );
}
