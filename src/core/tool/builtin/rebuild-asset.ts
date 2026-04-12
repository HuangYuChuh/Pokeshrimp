import { z } from "zod";
import type { Tool, ToolContext, ToolResult, PermissionResult } from "../types";
import { DesignfileEngine } from "@/core/designfile";

const inputSchema = z.object({
  asset: z.string().describe("The asset name to rebuild (key in designfile.yaml)"),
  force: z
    .boolean()
    .optional()
    .describe(
      "Force rebuild even if the asset is up to date. Default false.",
    ),
});

/**
 * Returns a build plan — the ordered list of assets that need
 * rebuilding. Does NOT execute the plan. The Agent reads the plan
 * and runs each skill step itself.
 *
 * This keeps the tool simple (read-only computation) and lets the
 * Agent exercise its core strength: orchestrating skill execution.
 */
export const rebuildAssetTool: Tool = {
  name: "rebuild_asset",
  description:
    "Compute a rebuild plan for a design asset and all its downstream dependents. Returns an ordered list of steps (asset name + skill + params) that need to be executed. Only includes assets that are actually dirty or never built. Use `force: true` to rebuild even if the asset appears up to date.",
  inputSchema,
  isBuiltin: true,

  isReadOnly() {
    return true;
  },

  isConcurrencySafe() {
    return true;
  },

  async checkPermissions(): Promise<PermissionResult> {
    return { behavior: "allow" };
  },

  async call(input: unknown, context: ToolContext): Promise<ToolResult> {
    const { asset, force } = input as z.infer<typeof inputSchema>;
    const engine = new DesignfileEngine(context.cwd);

    if (!engine.isLoaded) {
      return {
        success: false,
        data: null,
        error: "No designfile.yaml found in .visagent/.",
      };
    }

    const plan = engine.computeBuildPlan(asset, force ?? false);
    if (!plan) {
      return {
        success: false,
        data: null,
        error: "Failed to compute build plan.",
      };
    }

    return { success: true, data: plan };
  },
};
