import { z } from "zod";
import type { Tool, ToolContext, ToolResult, PermissionResult } from "../types";
import { DesignfileEngine } from "@/core/designfile";

const inputSchema = z.object({
  asset: z.string().describe("The asset name to list versions for."),
});

export const listAssetVersionsTool: Tool = {
  name: "list_asset_versions",
  description:
    "List all recorded build versions of a design asset, newest first. Returns version hashes, timestamps, params, and stored file paths so you can reference or retrieve past outputs.",
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
        error: "No designfile.yaml found in .visagent/.",
      };
    }

    const versions = engine.listVersions(asset);
    if (versions.length === 0) {
      return {
        success: true,
        data: {
          asset,
          versions: [],
          message: `No recorded versions for asset "${asset}".`,
        },
      };
    }

    return {
      success: true,
      data: {
        asset,
        totalVersions: versions.length,
        versions: versions.map((v) => ({
          hash: v.hash,
          timestamp: v.timestamp,
          skill: v.skill,
          params: v.params,
          command: v.command,
          outputFiles: v.outputFiles,
          storedFiles: v.storedFiles ?? [],
        })),
      },
    };
  },
};
