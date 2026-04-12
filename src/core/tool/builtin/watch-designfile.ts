import path from "path";
import { z } from "zod";
import type { Tool, ToolContext, ToolResult, PermissionResult } from "../types";
import { DesignfileWatcher, type ChangeReport } from "@/core/designfile/watcher";

const inputSchema = z.object({
  action: z
    .enum(["start", "stop", "status"])
    .describe(
      '"start" begins watching designfile.yaml for changes, "stop" stops watching, "status" returns current watcher state and last change report.',
    ),
});

/**
 * Singleton watcher keyed by cwd — one watcher per project directory.
 */
const watchers = new Map<
  string,
  { watcher: DesignfileWatcher; reports: ChangeReport[] }
>();

export const watchDesignfileTool: Tool = {
  name: "watch_designfile",
  description:
    "Watch the project's designfile.yaml for changes. When an asset's params change, computes which assets are affected (including downstream dependents) and stores a change report. Use action 'start' to begin, 'stop' to end, 'status' to check state and read reports.",
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
    const { action } = input as z.infer<typeof inputSchema>;
    const cwd = context.cwd;
    const designfilePath = path.join(cwd, ".visagent", "designfile.yaml");

    switch (action) {
      case "start": {
        if (watchers.has(cwd)) {
          return {
            success: true,
            data: { message: "Watcher is already running." },
          };
        }

        const reports: ChangeReport[] = [];
        const watcher = new DesignfileWatcher(designfilePath, (report) => {
          reports.push(report);
        });

        watcher.start();
        watchers.set(cwd, { watcher, reports });

        return {
          success: true,
          data: {
            message: `Now watching ${designfilePath} for changes.`,
          },
        };
      }

      case "stop": {
        const entry = watchers.get(cwd);
        if (!entry) {
          return {
            success: true,
            data: { message: "No watcher is running." },
          };
        }

        entry.watcher.stop();
        watchers.delete(cwd);

        return {
          success: true,
          data: { message: "Watcher stopped." },
        };
      }

      case "status": {
        const entry = watchers.get(cwd);
        if (!entry) {
          return {
            success: true,
            data: {
              active: false,
              message: "No watcher is running.",
              reports: [],
            },
          };
        }

        // Drain accumulated reports
        const pending = [...entry.reports];
        entry.reports.length = 0;

        return {
          success: true,
          data: {
            active: entry.watcher.active,
            message: pending.length > 0
              ? `${pending.length} change(s) detected since last poll.`
              : "Watching. No changes detected since last poll.",
            reports: pending,
          },
        };
      }
    }
  },
};
