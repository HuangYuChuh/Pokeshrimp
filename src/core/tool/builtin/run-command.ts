import { z } from "zod";
import { execSync } from "child_process";
import type { Tool, ToolContext, ToolResult, PermissionResult } from "../types";

const inputSchema = z.object({
  command: z.string().describe("Shell command to execute"),
});

export const runCommandTool: Tool = {
  name: "run_command",
  description: "Execute a shell command and return its output",
  inputSchema,
  isBuiltin: true,

  isReadOnly() {
    return false;
  },

  isDestructive() {
    return true;
  },

  async checkPermissions(
    _input: unknown,
    _context: ToolContext,
  ): Promise<PermissionResult> {
    return { behavior: "ask" };
  },

  async call(input: unknown, context: ToolContext): Promise<ToolResult> {
    const { command } = input as z.infer<typeof inputSchema>;
    try {
      const stdout = execSync(command, {
        cwd: context.cwd,
        timeout: 30000,
        encoding: "utf-8",
      });
      return { success: true, data: stdout };
    } catch (err) {
      const execErr = err as { stdout?: string; stderr?: string; message: string };
      return {
        success: false,
        data: execErr.stdout ?? null,
        error: execErr.stderr ?? execErr.message,
      };
    }
  },
};
