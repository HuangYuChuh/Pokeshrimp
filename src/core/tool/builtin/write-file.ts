import { z } from "zod";
import fs from "fs";
import path from "path";
import type { Tool, ToolContext, ToolResult, PermissionResult } from "../types";

const inputSchema = z.object({
  path: z.string().describe("Absolute or relative file path to write"),
  content: z.string().describe("Content to write to the file"),
});

export const writeFileTool: Tool = {
  name: "write_file",
  description: "Write content to a file on the local filesystem",
  inputSchema,
  isBuiltin: true,

  isReadOnly() {
    return false;
  },

  isDestructive() {
    return true;
  },

  async checkPermissions(_input: unknown, _context: ToolContext): Promise<PermissionResult> {
    return { behavior: "ask" };
  },

  async call(input: unknown, context: ToolContext): Promise<ToolResult> {
    const { path: filePath, content } = input as z.infer<typeof inputSchema>;
    const resolved = path.resolve(context.cwd, filePath);
    if (resolved !== context.cwd && !resolved.startsWith(context.cwd + path.sep)) {
      return {
        success: false,
        data: null,
        error: `Path "${filePath}" is outside the working directory`,
      };
    }
    try {
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      fs.writeFileSync(resolved, content, "utf-8");
      return { success: true, data: `Wrote ${content.length} bytes to ${resolved}` };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: `Failed to write file: ${(err as Error).message}`,
      };
    }
  },
};
