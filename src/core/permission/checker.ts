import type { PermissionBehavior } from "@/core/tool/types";
import type { PermissionConfig } from "@/core/permission/types";

export function parsePattern(pattern: string): {
  toolName: string;
  argPattern?: string;
} {
  const match = pattern.match(/^([^(]+?)(?:\((.+)\))?$/);
  if (!match) {
    return { toolName: pattern };
  }
  return {
    toolName: match[1],
    argPattern: match[2],
  };
}

function simpleWildcardMatch(pattern: string, value: string): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    "^" + escaped.replace(/\*\*/g, "{{GLOBSTAR}}").replace(/\*/g, "[^/]*").replace(/\{\{GLOBSTAR\}\}/g, ".*") + "$",
  );
  return regex.test(value);
}

function inputToString(input: unknown): string {
  if (typeof input === "string") return input;
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    const first = obj["command"] ?? obj["path"] ?? obj["file_path"];
    if (typeof first === "string") return first;
  }
  return JSON.stringify(input);
}

export function matchPattern(
  pattern: string,
  toolName: string,
  input?: unknown,
): boolean {
  const { toolName: pName, argPattern } = parsePattern(pattern);
  if (pName !== toolName) return false;
  if (!argPattern) return true;
  return simpleWildcardMatch(argPattern, inputToString(input));
}

export function checkPermission(
  toolName: string,
  input: unknown,
  config: PermissionConfig,
): PermissionBehavior {
  for (const pattern of config.alwaysDeny) {
    if (matchPattern(pattern, toolName, input)) return "deny";
  }
  for (const pattern of config.alwaysAllow) {
    if (matchPattern(pattern, toolName, input)) return "allow";
  }
  for (const pattern of config.alwaysAsk) {
    if (matchPattern(pattern, toolName, input)) return "ask";
  }
  return "ask";
}
