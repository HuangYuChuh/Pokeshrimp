import { streamText } from "ai";
import { getModel } from "@/lib/ai";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import {
  createSession,
  addMessage,
  touchSession,
} from "@/lib/db";
import { getToolRegistry } from "@/core/init";
import { bridgeToolsForAI } from "@/core/ai/tool-bridge";
import type { ToolContext } from "@/core/tool/types";

export async function POST(req: Request) {
  const { messages, modelId, sessionId } = await req.json();

  // Auto-create session if none provided
  let sid = sessionId as string | undefined;
  if (!sid) {
    const firstUserMsg = messages.find(
      (m: { role: string }) => m.role === "user"
    );
    const title = firstUserMsg
      ? (firstUserMsg.content as string).slice(0, 60)
      : "New Chat";
    const session = await createSession(title);
    sid = session.id;
  }

  // Persist the latest user message
  const lastMsg = messages[messages.length - 1];
  if (lastMsg) {
    await addMessage(sid, lastMsg.role, lastMsg.content);
  }

  // Setup tool context
  const registry = getToolRegistry();
  const context: ToolContext = {
    sessionId: sid,
    cwd: process.cwd(),
  };

  // Bridge tools for AI SDK
  const tools = bridgeToolsForAI(registry, context);

  const result = streamText({
    model: getModel(modelId),
    system: SYSTEM_PROMPT,
    messages,
    tools,
    maxSteps: 10,
    onFinish: async ({ text }) => {
      // Persist assistant reply
      if (sid && text) {
        await addMessage(sid, "assistant", text);
        await touchSession(sid);
      }
    },
  });

  return result.toDataStreamResponse({
    headers: { "X-Session-Id": sid },
  });
}
