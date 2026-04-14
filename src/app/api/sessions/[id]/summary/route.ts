import { NextResponse } from "next/server";
import { getSession, getMessages } from "@/lib/db";

/**
 * GET /api/sessions/[id]/summary
 *
 * Heuristic session summary — no LLM call. Extracts highlights from
 * the first user message, last assistant message, and any file paths
 * found in tool results.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const messages = await getMessages(id);
  if (messages.length <= 5) {
    return NextResponse.json({ summary: null, messageCount: messages.length });
  }

  // Extract highlights heuristically
  const firstUser = messages.find((m) => m.role === "user");
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  // Collect file paths from all messages (tool results often contain paths)
  const filePaths = new Set<string>();
  const fileRegex =
    /(?:^|[\s"'=:])(\/?(?:[\w./-]+\/)?[\w.-]+\.(?:png|jpe?g|gif|webp|svg|bmp|tiff?|mp4|mov|avi|mkv|webm|pdf|psd|ai|sketch|fig))\b/gi;

  for (const msg of messages) {
    const matches = msg.content.match(fileRegex);
    if (matches) {
      for (const raw of matches) {
        const fp = raw.trim().replace(/^["'=:]/, "");
        const name = fp.split("/").pop() ?? fp;
        filePaths.add(name);
      }
    }
  }

  // Build summary parts
  const parts: string[] = [];

  if (firstUser) {
    const preview =
      firstUser.content.length > 60 ? firstUser.content.slice(0, 60) + "..." : firstUser.content;
    parts.push(`Started with: "${preview}"`);
  }

  if (filePaths.size > 0) {
    const fileList = Array.from(filePaths).slice(0, 5).join(", ");
    parts.push(`Generated: ${fileList}`);
  }

  if (lastAssistant) {
    const preview =
      lastAssistant.content.length > 60
        ? lastAssistant.content.slice(0, 60) + "..."
        : lastAssistant.content;
    parts.push(`Last action: ${preview}`);
  }

  const lastMessage = messages[messages.length - 1];

  return NextResponse.json({
    summary: parts.join("\n"),
    messageCount: messages.length,
    lastActiveAt: lastMessage?.createdAt ?? session.updatedAt,
  });
}
