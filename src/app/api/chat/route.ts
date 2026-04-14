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

function missingApiKeyResponse(provider: string): Response {
  return new Response(
    JSON.stringify({
      error: `${provider} API key not configured. Open Settings to add your API key.`,
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

  // Preflight: figure out which provider this model uses, and verify its
  // key is set in either config or env. The Anthropic/OpenAI SDKs don't
  // throw at construction time when the key is missing, so without this
  // check the failure only surfaces ~10s later after internal retries.
  const config = getConfig();
  // Use the user's selected model, or fall back to config default, or first available
  const allModels = buildModelOptions(config.customProviders);
  const resolvedModelId = modelId ?? config.defaultModel ?? allModels[0]?.id ?? "claude-sonnet";
  const option = allModels.find((m) => m.id === resolvedModelId);
  if (!option) {
    return new Response(JSON.stringify({ error: `Unknown model: ${modelId}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  // For custom providers, the key is in the provider config itself.
  // For built-in providers, check config + env vars.
  if (option.provider === "custom") {
    const cp = config.customProviders?.[option.customProviderId ?? ""];
    if (!cp?.apiKey && !cp?.baseURL) {
      return missingApiKeyResponse("custom");
    }
  } else {
    const apiKey =
      option.provider === "anthropic"
        ? config.apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY
        : config.apiKeys?.openai || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return missingApiKeyResponse(option.provider);
    }
  }

  let model;
  try {
    model = getModel(
      option.id,
      { anthropic: config.apiKeys?.anthropic, openai: config.apiKeys?.openai },
      config.customProviders,
    );
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
    // Forward client-cancellation through to long-running tools
    // (e.g. run_command) so they can abort early.
    signal: req.signal,
  };

  // Stream every iteration's data into a single client-facing stream.
  // The runtime owns the loop; createDataStreamResponse owns the protocol.
  return createDataStreamResponse({
    headers: { "X-Session-Id": sid },
    execute: async (dataStream) => {
      // Wire the approval channel: when CommandApprovalMiddleware gets
      // an "ask" decision, it calls channel.request() which writes an
      // approval-request event into this data stream and blocks until
      // the POST /api/approval endpoint resolves it.
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
