import type { Tool } from "@/core/tool/types";

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  unregisterTool(name: string): boolean {
    return this.tools.delete(name);
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  getToolsByServer(serverName: string): Tool[] {
    return this.getAllTools().filter((t) => t.isMcp && t.serverName === serverName);
  }

  clear(): void {
    this.tools.clear();
  }
}
