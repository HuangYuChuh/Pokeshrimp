import type { ToolRegistry } from "@/core/tool/registry";
import type {
  ToolContext,
  ToolExecutionHooks,
  ToolResult,
} from "@/core/tool/types";

export async function executeTool(
  registry: ToolRegistry,
  toolName: string,
  input: unknown,
  context: ToolContext,
  hooks?: ToolExecutionHooks,
): Promise<ToolResult> {
  const tool = registry.getTool(toolName);
  if (!tool) {
    return { success: false, data: null, error: `Tool "${toolName}" not found` };
  }

  const parsed = tool.inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: `Invalid input: ${parsed.error.message}`,
    };
  }

  let validatedInput: unknown = parsed.data;

  const perm = await tool.checkPermissions(validatedInput, context);
  if (perm.behavior === "deny") {
    return {
      success: false,
      data: null,
      error: perm.message ?? "Permission denied",
    };
  }
  if (perm.updatedInput !== undefined) {
    validatedInput = perm.updatedInput;
  }

  if (hooks?.onPreToolUse) {
    const pre = await hooks.onPreToolUse(toolName, validatedInput);
    if (!pre.allow) {
      return { success: false, data: null, error: "Blocked by pre-tool hook" };
    }
    if (pre.updatedInput !== undefined) {
      validatedInput = pre.updatedInput;
    }
  }

  let result: ToolResult;
  try {
    result = await tool.call(validatedInput, context);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (hooks?.onPostToolUseFailure) {
      await hooks.onPostToolUseFailure(toolName, validatedInput, error);
    }
    return { success: false, data: null, error: error.message };
  }

  if (hooks?.onPostToolUse) {
    await hooks.onPostToolUse(toolName, validatedInput, result);
  }

  return result;
}
