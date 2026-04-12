import { readFileTool } from "./read-file";
import { writeFileTool } from "./write-file";
import { listDirectoryTool } from "./list-directory";
import { runCommandTool } from "./run-command";
import { readSkillTool } from "./read-skill";
import { readDesignfileTool } from "./read-designfile";
import { rebuildAssetTool } from "./rebuild-asset";
import { markAssetBuiltTool } from "./mark-asset-built";
import type { ToolRegistry } from "../registry";

export const builtinTools = [
  readFileTool,
  writeFileTool,
  listDirectoryTool,
  runCommandTool,
  readSkillTool,
  readDesignfileTool,
  rebuildAssetTool,
  markAssetBuiltTool,
];

export function registerBuiltinTools(registry: ToolRegistry): void {
  for (const tool of builtinTools) {
    registry.registerTool(tool);
  }
}
