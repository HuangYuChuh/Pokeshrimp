import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { PreviewPanel } from "@/components/preview-panel";

export default function Home() {
  return (
    <main className="flex h-screen w-screen">
      <Sidebar />
      <ChatPanel />
      <PreviewPanel />
    </main>
  );
}
