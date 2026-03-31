import { ToolRegistry } from "@/core/tool/registry";
import { registerBuiltinTools } from "@/core/tool/builtin";
import { getConfig } from "@/core/config/loader";
import { initAppState } from "@/core/state";
import type { AppConfig } from "@/core/config/schema";

let registry: ToolRegistry | null = null;

export function getToolRegistry(): ToolRegistry {
  if (!registry) {
    registry = new ToolRegistry();
    registerBuiltinTools(registry);
  }
  return registry;
}

export function initApp(): { registry: ToolRegistry; config: AppConfig } {
  const config = getConfig();
  initAppState(config);
  const reg = getToolRegistry();
  return { registry: reg, config };
}
