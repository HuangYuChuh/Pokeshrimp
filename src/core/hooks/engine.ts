import { spawn } from "child_process";
import type {
  HookAction,
  HookConfig,
  HookEvent,
  HookInput,
  HookOutput,
} from "./types";

export function matchEvent(
  matcher: string | undefined,
  toolName?: string,
): boolean {
  if (!matcher) return true;
  if (!toolName) return false;
  const patterns = matcher.split("|");
  return patterns.includes(toolName);
}

export function executeHookAction(
  action: HookAction,
  input: HookInput,
): Promise<HookOutput | null> {
  const timeout = action.timeout ?? 10000;

  return new Promise((resolve) => {
    const proc = spawn(action.command, {
      shell: true,
      stdio: ["pipe", "pipe", "pipe"],
      cwd: input.cwd,
    });

    let stdout = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill("SIGKILL");
        resolve(null);
      }
    }, timeout);

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.on("error", () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(null);
      }
    });

    proc.on("close", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        if (code !== 0) {
          resolve(null);
          return;
        }
        try {
          resolve(JSON.parse(stdout) as HookOutput);
        } catch {
          resolve(null);
        }
      }
    });

    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}

export async function runHooks(
  event: HookEvent,
  input: HookInput,
  configs: Record<string, HookConfig[]>,
): Promise<HookOutput | null> {
  const eventConfigs = configs[event];
  if (!eventConfigs || eventConfigs.length === 0) return null;

  const matched = eventConfigs.filter((cfg) =>
    matchEvent(cfg.matcher, input.tool_name),
  );
  if (matched.length === 0) return null;

  let mergedInput: unknown = undefined;
  let lastMessage: string | undefined;

  for (const cfg of matched) {
    for (const action of cfg.hooks) {
      const result = await executeHookAction(action, input);
      if (!result) continue;

      if (result.decision === "deny") {
        return result;
      }

      if (result.updatedInput !== undefined) {
        mergedInput = mergedInput !== undefined
          ? { ...(mergedInput as Record<string, unknown>), ...(result.updatedInput as Record<string, unknown>) }
          : result.updatedInput;
      }

      if (result.message !== undefined) {
        lastMessage = result.message;
      }
    }
  }

  if (mergedInput === undefined && lastMessage === undefined) return null;

  return {
    decision: "allow",
    ...(mergedInput !== undefined && { updatedInput: mergedInput }),
    ...(lastMessage !== undefined && { message: lastMessage }),
  };
}
