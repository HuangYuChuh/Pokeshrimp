import { z } from "zod";
import type { Tool, ToolContext, ToolResult, PermissionResult } from "../types";
import { DesignfileEngine } from "@/core/designfile";

const inputSchema = z.object({
  asset: z
    .string()
    .optional()
    .describe(
      "Optional: get details for a specific asset. Omit to get the full overview.",
    ),
});

export const readDesignfileTool: Tool = {
  name: "read_designfile",
  description:
    "Read the project's designfile (asset dependency graph). Returns brand info, all assets with their skills/params/dependencies/build status, and the topological build order. Use this to understand the project's asset structure before running skills.",
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
    const { asset } = input as z.infer<typeof inputSchema>;
    const engine = new DesignfileEngine(context.cwd);

    if (!engine.isLoaded) {
      return {
        success: false,
        data: null,
        error:
          "No designfile.yaml found in .visagent/. Create one to define your brand assets and their dependencies.",
      };
    }

    if (engine.cycleError) {
      return {
        success: false,
        data: null,
        error: `Designfile has a dependency cycle: ${engine.cycleError}`,
      };
    }

    const overview = engine.getOverview();
    if (!overview) {
      return { success: false, data: null, error: "Failed to load designfile" };
    }

    if (asset) {
      const found = overview.assets.find((a) => a.name === asset);
      if (!found) {
        return {
          success: false,
          data: null,
          error: `Asset "${asset}" not found. Available: ${overview.assets.map((a) => a.name).join(", ")}`,
        };
      }

      const versions = engine.listVersions(asset);
      return {
        success: true,
        data: {
          brand: overview.brand,
          asset: found,
          versionCount: versions.length,
          latestVersion: versions[0] ?? null,
        },
      };
    }

    return { success: true, data: overview };
  },
};
