import fs from "fs";
import path from "path";

/**
 * Persist an "always allow" pattern into the project-level config.
 *
 * Reads `.visagent/config.json`, appends the pattern to
 * `permissions.alwaysAllow` (if not already present), and writes back.
 * Creates the file and parent directory if they don't exist.
 *
 * Scope is project-level (not global) — a pattern approved in one
 * project does not affect another.
 */
export function persistAlwaysAllow(
  pattern: string,
  cwd: string,
): void {
  const configDir = path.join(cwd, ".visagent");
  const configPath = path.join(configDir, "config.json");

  let config: Record<string, unknown> = {};
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    config = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // File doesn't exist or isn't valid JSON — start fresh
  }

  const permissions = (config.permissions ?? {}) as Record<string, unknown>;
  const alwaysAllow = Array.isArray(permissions.alwaysAllow)
    ? (permissions.alwaysAllow as string[])
    : [];

  if (alwaysAllow.includes(pattern)) return; // already present

  alwaysAllow.push(pattern);
  permissions.alwaysAllow = alwaysAllow;
  config.permissions = permissions;

  try {
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  } catch {
    // Best-effort — if we can't write, the pattern won't be remembered
    // but the current command still proceeds.
  }
}

/**
 * Derive a glob pattern from a specific command string.
 *
 * Strategy: take the first token (binary name). If the second token
 * doesn't start with "-", include it as a subcommand. Append "*".
 *
 *   "comfyui-cli generate --workflow ..." → "comfyui-cli generate *"
 *   "ffmpeg -i input.mp4 ..."            → "ffmpeg *"
 *   "rembg input.png output.png"         → "rembg *"
 */
export function derivePattern(command: string): string {
  const tokens = command.trim().split(/\s+/);
  if (tokens.length === 0) return "*";

  const binary = tokens[0];
  if (tokens.length > 1 && !tokens[1].startsWith("-")) {
    return `${binary} ${tokens[1]} *`;
  }
  return `${binary} *`;
}
