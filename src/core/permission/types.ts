export type { PermissionBehavior, PermissionResult } from "@/core/tool/types";

export interface PermissionRule {
  pattern: string; // "Bash(npm run *)", "Edit(docs/**)", "Read"
  behavior: "allow" | "deny" | "ask";
  source: "user" | "project" | "local";
}

export interface PermissionConfig {
  alwaysAllow: string[];
  alwaysDeny: string[];
  alwaysAsk: string[];
}
