import { streamText } from "ai";
import { getModel } from "@/lib/ai";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";

export async function POST(req: Request) {
  const { messages, modelId } = await req.json();

  const result = streamText({
    model: getModel(modelId),
    system: SYSTEM_PROMPT,
    messages,
  });

  return result.toDataStreamResponse();
}
