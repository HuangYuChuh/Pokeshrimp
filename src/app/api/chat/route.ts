import { getModel } from "@/lib/ai";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { createSession, addMessage, touchSession } from "@/lib/db";
import { getToolRegistry } from "@/core/init";
import { getConfig } from "@/core/config/loader";
import {
  runAgent,
  createCommandApprovalMiddleware,
  createLoopDetectionMiddleware,
  buildSkillPromptSection,
  type Middleware,
} from "@/core/agent";
import { listSkills } from "@/lib/skill-engine";
import type { ToolContext } from "@/core/tool/types";

// Build middlewares once (reused across requests)
function getMiddlewares(): Middleware[] {
  const config = getConfig();
  return [
    createCommandApprovalMiddleware({
      alwaysAllow: config.permissions?.alwaysAllow ?? [],
      alwaysDeny: config.permissions?.alwaysDeny ?? [],
    }),
    createLoopDetectionMiddleware(3),
  ];
}

// Build system prompt with available skills
function getSystemPrompt(): string {
  const skills = listSkills();
  const skillSection = buildSkillPromptSection(
    skills.map((s) => ({
      name: s.name,
      command: s.command,
      description: s.description,
    })),
  );
  return SYSTEM_PROMPT + skillSection;
}

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

  // Get model (with error handling for missing API key)
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

  // Run agent with middleware chain
  const result = runAgent(
    {
      model,
      systemPrompt: getSystemPrompt(),
      registry: getToolRegistry(),
      context: { sessionId: sid, cwd: process.cwd() } as ToolContext,
      middlewares: getMiddlewares(),
      maxIterations: 32,
    },
    messages,
    {
      async onFinish({ text }) {
        if (sid && text) {
          await addMessage(sid, "assistant", text);
          await touchSession(sid);
        }
      },
    },
  );

  return result.toDataStreamResponse({
    headers: { "X-Session-Id": sid },
  });
}
