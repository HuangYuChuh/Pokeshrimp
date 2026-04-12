import { z } from "zod";
import fs from "fs";
import path from "path";
import type { Tool, ToolContext, ToolResult, PermissionResult } from "../types";

const inputSchema = z.object({
  path: z.string().describe("Absolute or relative directory path to list"),
});

export const listDirectoryTool: Tool = {
  name: "list_directory",
  description: "List the contents of a directory on the local filesystem",
  inputSchema,
  isBuiltin: true,

  isReadOnly() {
    return true;
  },

  async checkPermissions(
    _input: unknown,
    _context: ToolContext,
  ): Promise<PermissionResult> {
    return { behavior: "allow" };
  },

  async call(input: unknown, context: ToolContext): Promise<ToolResult> {
    const { path: dirPath } = input as z.infer<typeof inputSchema>;
    const resolved = path.resolve(context.cwd, dirPath);
    if (resolved !== context.cwd && !resolved.startsWith(context.cwd + path.sep)) {
      return { success: false, data: null, error: `Path "${dirPath}" is outside the working directory` };
    }
    try {
      const entries = fs.readdirSync(resolved, { withFileTypes: true });
      const items = entries.map((entry) => ({
        name: entry.name,
        type: entry.isDirectory() ? "directory" : "file",
      }));
      return { success: true, data: items };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: `Failed to list directory: ${(err as Error).message}`,
      };
    }
  },
};
