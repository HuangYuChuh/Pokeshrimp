import { z } from "zod";
import type { Tool, ToolContext, ToolResult, PermissionResult } from "../types";
import { DesignfileEngine } from "@/core/designfile";

const inputSchema = z.object({
  asset: z.string().describe("The asset name that was just built"),
  params: z
    .record(z.unknown())
    .default({})
    .describe("The params that were used for this build"),
  outputFiles: z
    .array(z.string())
    .default([])
    .describe("Paths of generated output files"),
  command: z
    .string()
    .optional()
    .describe("The shell command that was executed (if applicable)"),
});

/**
 * After the Agent successfully runs a skill for a designfile asset,
 * it calls this tool to update the build state and record a version
 * in the history. This closes the loop:
 *
 *   read_designfile → rebuild_asset (get plan) → run skills →
 *   mark_asset_built → state updated + version recorded
 */
export const markAssetBuiltTool: Tool = {
  name: "mark_asset_built",
  description:
    "Mark a design asset as successfully built. Updates the build state (so downstream assets know this dependency is fresh) and records a version in the history (so the build can be retrieved or diffed later). Call this after each skill execution during a designfile rebuild.",
  inputSchema,
  isBuiltin: true,

  isReadOnly() {
    return false;
  },

  async checkPermissions(): Promise<PermissionResult> {
    return { behavior: "allow" };
  },

  async call(input: unknown, context: ToolContext): Promise<ToolResult> {
    const { asset, params, outputFiles, command } = input as z.infer<
      typeof inputSchema
    >;
    const engine = new DesignfileEngine(context.cwd);

    if (!engine.isLoaded) {
      return {
        success: false,
        data: null,
        error: "No designfile.yaml found in .visagent/.",
      };
    }

    const version = engine.markBuilt(asset, params, outputFiles, command);
    return {
      success: true,
      data: {
        asset,
        version: {
          hash: version.hash,
          timestamp: version.timestamp,
          outputFiles: version.outputFiles,
        },
        message: `Asset "${asset}" marked as built. Version ${version.hash} recorded.`,
      },
    };
  },
};
