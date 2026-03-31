import { z } from "zod";
import fs from "fs";
import path from "path";
import type { Tool, ToolContext, ToolResult, PermissionResult } from "../types";

const inputSchema = z.object({
  path: z.string().describe("Absolute or relative file path to read"),
});

export const readFileTool: Tool = {
  name: "read_file",
  description: "Read the contents of a file from the local filesystem",
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
    const { path: filePath } = input as z.infer<typeof inputSchema>;
    const resolved = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(context.cwd, filePath);
    try {
      const content = fs.readFileSync(resolved, "utf-8");
      return { success: true, data: content };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: `Failed to read file: ${(err as Error).message}`,
      };
    }
  },
};
