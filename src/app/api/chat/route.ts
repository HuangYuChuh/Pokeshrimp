import { streamText } from "ai";
import { getModel } from "@/lib/ai";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import {
  createSession,
  addMessage,
  touchSession,
} from "@/lib/db";

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

  const result = streamText({
    model: getModel(modelId),
    system: SYSTEM_PROMPT,
    messages,
    onFinish: async ({ text }) => {
      // Persist assistant reply
      if (sid) {
        await addMessage(sid, "assistant", text);
        await touchSession(sid);
      }
    },
  });

  return result.toDataStreamResponse({
    headers: { "X-Session-Id": sid },
  });
}
