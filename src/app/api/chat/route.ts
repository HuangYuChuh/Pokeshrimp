import { createDataStreamResponse } from "ai";
import { getModel } from "@/lib/ai";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { createSession, addMessage, touchSession } from "@/lib/db";
import { getRuntime } from "@/core/init";
import type { ToolContext } from "@/core/tool/types";

export async function POST(req: Request) {
  const { messages, modelId, sessionId } = await req.json();

  // Auto-create session
  let sid = sessionId as string | undefined;
  if (!sid) {
    const firstUserMsg = messages.find(
      (m: { role: string }) => m.role === "user",
    );
    const title = firstUserMsg
      ? (firstUserMsg.content as string).slice(0, 60)
      : "New Chat";
    const session = await createSession(title);
    sid = session.id;
  }

  // Persist latest user message
  const lastMsg = messages[messages.length - 1];
  if (lastMsg) {
    await addMessage(sid, lastMsg.role, lastMsg.content);
  }

  // Resolve model (with error handling for missing API key)
  let model;
  try {
    model = getModel(modelId);
  } catch {
    return new Response(
      JSON.stringify({
        error: "API key not configured. Open Settings to add your API key.",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const runtime = getRuntime();
  const context: ToolContext = { sessionId: sid, cwd: process.cwd() };

  // Stream every iteration's data into a single client-facing stream.
  // The runtime owns the loop; createDataStreamResponse owns the protocol.
  return createDataStreamResponse({
    headers: { "X-Session-Id": sid },
    execute: async (dataStream) => {
      const result = await runtime.run({
        model,
        systemPrompt: SYSTEM_PROMPT,
        messages,
        context,
        onIterationStream: (stream) => {
          stream.mergeIntoDataStream(dataStream);
        },
      });

      if (sid && result.text) {
        await addMessage(sid, "assistant", result.text);
        await touchSession(sid);
      }
    },
    onError: (error) =>
      error instanceof Error ? error.message : "Unknown error",
  });
}
