import { createDataStreamResponse } from "ai";
import { getModel, MODEL_OPTIONS } from "@/core/ai/provider";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { createSession, addMessage, touchSession } from "@/lib/db";
import { getRuntime } from "@/core/init";
import { getConfig } from "@/core/config/loader";
import { approvalBus } from "@/app/api/approval/channel";
import type { ToolContext } from "@/core/tool/types";

function missingApiKeyResponse(provider: string): Response {
  return new Response(
    JSON.stringify({
      error: `${provider} API key not configured. Open Settings to add your API key.`,
    }),
    { status: 401, headers: { "Content-Type": "application/json" } },
  );
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

  // Preflight: figure out which provider this model uses, and verify its
  // key is set in either config or env. The Anthropic/OpenAI SDKs don't
  // throw at construction time when the key is missing, so without this
  // check the failure only surfaces ~10s later after internal retries.
  const config = getConfig();
  const option = MODEL_OPTIONS.find((m) => m.id === (modelId ?? "claude-sonnet"));
  if (!option) {
    return new Response(
      JSON.stringify({ error: `Unknown model: ${modelId}` }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const apiKey =
    option.provider === "anthropic"
      ? config.apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY
      : config.apiKeys?.openai || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return missingApiKeyResponse(option.provider);
  }

  let model;
  try {
    model = getModel(option.id, {
      anthropic: config.apiKeys?.anthropic,
      openai: config.apiKeys?.openai,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Failed to resolve model",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const runtime = getRuntime();
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
        messages,
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
    onError: (error) =>
      error instanceof Error ? error.message : "Unknown error",
  });
}
