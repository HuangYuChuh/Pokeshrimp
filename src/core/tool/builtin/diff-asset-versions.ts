import { z } from "zod";
import type { Tool, ToolContext, ToolResult, PermissionResult } from "../types";
import { DesignfileEngine } from "@/core/designfile";

const inputSchema = z.object({
  asset: z.string().describe("The asset name to diff versions for."),
  hashA: z
    .string()
    .optional()
    .describe(
      "Hash of the older version. If omitted along with hashB, diffs the two most recent versions.",
    ),
  hashB: z
    .string()
    .optional()
    .describe(
      "Hash of the newer version. If omitted along with hashA, diffs the two most recent versions.",
    ),
});

function formatValue(v: unknown): string {
  if (typeof v === "string") return `'${v}'`;
  return JSON.stringify(v);
}

function buildSummary(diff: {
  added: Record<string, unknown>;
  removed: Record<string, unknown>;
  changed: Record<string, { from: unknown; to: unknown }>;
}): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(diff.changed)) {
    const { from, to } = value as { from: unknown; to: unknown };
    parts.push(`${key} changed from ${formatValue(from)} to ${formatValue(to)}`);
  }

  for (const [key, value] of Object.entries(diff.added)) {
    parts.push(`${key} added with value ${formatValue(value)}`);
  }

  for (const [key, value] of Object.entries(diff.removed)) {
    parts.push(`${key} removed (was ${formatValue(value)})`);
  }

  if (parts.length === 0) return "No parameter differences.";
  return parts.join(", ");
}

export const diffAssetVersionsTool: Tool = {
  name: "diff_asset_versions",
  description:
    "Compare parameters between two versions of a design asset. Shows added, removed, and changed params with a human-readable summary. If no hashes are provided, diffs the two most recent versions.",
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
    const { asset, hashA, hashB } = input as z.infer<typeof inputSchema>;
    const engine = new DesignfileEngine(context.cwd);

    if (!engine.isLoaded) {
      return {
        success: false,
        data: null,
        error: "No designfile.yaml found in .visagent/.",
      };
    }

    let resolvedHashA: string;
    let resolvedHashB: string;

    if (hashA && hashB) {
      resolvedHashA = hashA;
      resolvedHashB = hashB;
    } else {
      // Use the two most recent versions
      const versions = engine.listVersions(asset);
      if (versions.length < 2) {
        return {
          success: false,
          data: null,
          error:
            versions.length === 0
              ? `No recorded versions for asset "${asset}". Build it at least twice to diff.`
              : `Only one version exists for asset "${asset}". Build it again with different params to diff.`,
        };
      }
      resolvedHashA = versions[1].hash; // older
      resolvedHashB = versions[0].hash; // newer
    }

    const diff = engine.diffVersions(asset, resolvedHashA, resolvedHashB);
    if (!diff) {
      return {
        success: false,
        data: null,
        error: `Could not find one or both versions: hashA="${resolvedHashA}", hashB="${resolvedHashB}" for asset "${asset}".`,
      };
    }

    return {
      success: true,
      data: {
        asset,
        hashA: resolvedHashA,
        hashB: resolvedHashB,
        added: diff.added,
        removed: diff.removed,
        changed: diff.changed,
        summary: buildSummary(diff),
      },
    };
  },
};
