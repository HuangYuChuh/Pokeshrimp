import { z } from "zod";
import { createDataStreamResponse } from "ai";
import { getModel, buildModelOptions } from "@/core/ai/provider";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { createSession, addMessage, touchSession } from "@/lib/db";
import { getRuntime } from "@/core/init";
import { getConfig } from "@/core/config/loader";
import { approvalBus } from "@/app/api/approval/channel";
import { rateLimit } from "@/core/http/rate-limit";
import type { ToolContext } from "@/core/tool/types";
import type { CoreMessage } from "ai";

const limiter = rateLimit({ interval: 60_000, limit: 20 });

const ChatRequestSchema = z.object({
  messages: z.array(
    z
      .object({
        role: z.string(),
        content: z.unknown(),
      })
      .passthrough(),
  ),
  modelId: z.string().optional(),
  sessionId: z.string().nullable().optional(),
});

function missingApiKeyResponse(providerName: string): Response {
  return new Response(
    JSON.stringify({
      error: `${providerName} API key not configured. Open Settings → Providers to add your API key.`,
    }),
    { status: 401, headers: { "Content-Type": "application/json" } },
  );
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  const { success } = limiter(ip);
  if (!success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  const body = await req.json();
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const { messages, modelId, sessionId } = parsed.data;

  // Auto-create session
  let sid = sessionId as string | undefined;
  if (!sid) {
    const firstUserMsg = messages.find((m: { role: string }) => m.role === "user");
    const title = firstUserMsg ? (firstUserMsg.content as string).slice(0, 60) : "New Chat";
    const session = await createSession(title);
    sid = session.id;
  }

  // Persist latest user message
  const lastMsg = messages[messages.length - 1];
  if (lastMsg) {
    await addMessage(sid, lastMsg.role, lastMsg.content as string);
  }

  // Resolve model from unified providers
  const config = getConfig();
  const allModels = buildModelOptions(config.providers);
  const resolvedModelId = modelId ?? config.defaultModel ?? allModels[0]?.id;

  if (!resolvedModelId) {
    return new Response(
      JSON.stringify({
        error: "No model configured. Open Settings → Providers to set up a provider.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const option = allModels.find((m) => m.id === resolvedModelId);
  if (!option) {
    return new Response(JSON.stringify({ error: `Unknown model: ${resolvedModelId}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Preflight: verify API key exists
  const providerConfig = config.providers[option.providerId];
  const envKey =
    option.providerId === "anthropic"
      ? process.env.ANTHROPIC_API_KEY
      : option.providerId === "openai"
        ? process.env.OPENAI_API_KEY
        : undefined;

  if (!providerConfig?.apiKey && !envKey) {
    return missingApiKeyResponse(option.providerName);
  }

  let model;
  try {
    model = getModel(resolvedModelId, config.providers);
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Failed to resolve model",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const runtime = await getRuntime();
  const context: ToolContext = {
    sessionId: sid,
    cwd: process.cwd(),
    signal: req.signal,
  };

  return createDataStreamResponse({
    headers: { "X-Session-Id": sid },
    execute: async (dataStream) => {
      const contextWithApproval: ToolContext = {
        ...context,
        approvalChannel: {
          request: (req) => approvalBus.request(req, dataStream),
        },
      };

      const result = await runtime.run({
        model,
        systemPrompt: SYSTEM_PROMPT,
        messages: messages as CoreMessage[],
        context: contextWithApproval,
        onIterationStream: (stream) => {
          stream.mergeIntoDataStream(dataStream);
        },
      });

      if (sid && result.text) {
        await addMessage(sid, "assistant", result.text);
        await touchSession(sid);
      }
    },
    onError: (error) => (error instanceof Error ? error.message : "Unknown error"),
  });
}
