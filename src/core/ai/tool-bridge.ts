import { tool as aiTool, type CoreTool } from "ai";
import type { ToolRegistry } from "@/core/tool/registry";
import type { ToolContext, ToolExecutionHooks } from "@/core/tool/types";
import { executeTool } from "@/core/tool/executor";

export function bridgeToolsForAI(
  registry: ToolRegistry,
  context: ToolContext,
  hooks?: ToolExecutionHooks,
): Record<string, CoreTool> {
  const tools: Record<string, CoreTool> = {};

  for (const t of registry.getAllTools()) {
    tools[t.name] = aiTool({
      description: t.description,
      parameters: t.inputSchema,
      execute: async (input) => {
        const result = await executeTool(
          registry,
          t.name,
          input,
          context,
          hooks,
        );
        if (!result.success) {
          return `Error: ${result.error}`;
        }
        return typeof result.data === "string"
          ? result.data
          : JSON.stringify(result.data, null, 2);
      },
    });
  }

  return tools;
}
