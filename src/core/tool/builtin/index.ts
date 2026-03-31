import { readFileTool } from "./read-file";
import { writeFileTool } from "./write-file";
import { listDirectoryTool } from "./list-directory";
import { runCommandTool } from "./run-command";
import type { ToolRegistry } from "../registry";

export const builtinTools = [
  readFileTool,
  writeFileTool,
  listDirectoryTool,
  runCommandTool,
];

export function registerBuiltinTools(registry: ToolRegistry): void {
  for (const tool of builtinTools) {
    registry.registerTool(tool);
  }
}
