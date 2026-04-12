import fs from "fs";
import path from "path";
import type { HookEventName, HookEntry } from "./types";

const KNOWN_EVENTS: ReadonlySet<string> = new Set([
  "session-start",
  "pre-tool-call",
  "post-tool-call",
  "post-generate",
  "pre-export",
  "on-error",
  "on-approve",
  "session-end",
]);

/**
 * Load hooks from both convention files and config entries.
 *
 * Convention: executable files in `hooksDir` named after event names
 * (e.g. `.visagent/hooks/post-generate`) auto-register as hooks for
 * that event. Convention hooks run first, then config-defined hooks.
 *
 * Unknown event names in config produce a console warning but do not
 * throw — forward-compatible for future events.
 */
export function loadHooks(
  configHooks: Record<string, Array<{ command: string; timeout?: number; matcher?: string }>>,
  hooksDir: string,
): Map<string, HookEntry[]> {
  const result = new Map<string, HookEntry[]>();

  // 1. Convention: scan hooksDir for executable files named after events
  if (fs.existsSync(hooksDir)) {
    try {
      for (const filename of fs.readdirSync(hooksDir)) {
        if (!KNOWN_EVENTS.has(filename)) continue;
        const filePath = path.join(hooksDir, filename);
        try {
          const stat = fs.statSync(filePath);
          if (!stat.isFile()) continue;
        } catch {
          continue;
        }
        const event = filename as HookEventName;
        const entries = result.get(event) ?? [];
        entries.push({
          command: filePath,
          timeout: 10_000,
        });
        result.set(event, entries);
      }
    } catch {
      // hooksDir unreadable — skip convention hooks
    }
  }

  // 2. Config: append config-defined hooks after convention hooks
  for (const [eventName, hooks] of Object.entries(configHooks)) {
    if (!KNOWN_EVENTS.has(eventName)) {
      console.warn(
        `[hooks] Unknown event "${eventName}" in config — ignoring. ` +
          `Known events: ${[...KNOWN_EVENTS].join(", ")}`,
      );
      continue;
    }
    const event = eventName as HookEventName;
    const entries = result.get(event) ?? [];
    for (const h of hooks) {
      entries.push({
        command: h.command,
        timeout: h.timeout ?? 10_000,
        matcher: h.matcher,
      });
    }
    result.set(event, entries);
  }

  return result;
}
