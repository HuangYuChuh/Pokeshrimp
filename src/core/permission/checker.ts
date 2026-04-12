import type { PermissionConfig } from "./types";

/**
 * Match a shell command string against a glob pattern.
 * Patterns use `*` as a wildcard for any characters; all regex
 * metacharacters are escaped before substitution.
 *
 *   matchCommandPattern("comfyui-cli generate --w 512", "comfyui-cli *") → true
 *   matchCommandPattern("rm -rf /tmp/foo", "rm -rf *")                   → true
 *   matchCommandPattern("ls", "rm *")                                    → false
 */
export function matchCommandPattern(
  command: string,
  pattern: string,
): boolean {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp("^" + escaped.replace(/\*/g, ".*") + "$");
  return regex.test(command);
}

export type CommandDecision = "allow" | "deny" | "ask";

/**
 * Per docs/01 §3.3: classify a shell command against the configured
 * approval policy.
 *
 *   - alwaysDeny patterns win first (safety-critical)
 *   - alwaysAllow patterns next (whitelisted commands)
 *   - alwaysAsk patterns next (explicitly require user confirmation)
 *   - unmatched commands fall through to "ask" so the user can decide
 */
export function classifyCommand(
  command: string,
  config: PermissionConfig,
): CommandDecision {
  for (const pattern of config.alwaysDeny) {
    if (matchCommandPattern(command, pattern)) return "deny";
  }
  for (const pattern of config.alwaysAllow) {
    if (matchCommandPattern(command, pattern)) return "allow";
  }
  for (const pattern of config.alwaysAsk) {
    if (matchCommandPattern(command, pattern)) return "ask";
  }
  return "ask";
}
