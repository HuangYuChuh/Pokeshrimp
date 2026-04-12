import { spawn } from "child_process";
import type {
  HookEventName,
  HookEntry,
  HookPayload,
  HookResponse,
} from "./types";
import { BLOCKING_EVENTS } from "./types";

// ─── HooksEngine ─────────────────────────────────────────────

const DEFAULT_TIMEOUT = 10_000;

/**
 * The hooks engine dispatches named events to user-configured shell
 * scripts. Scripts receive a JSON payload on stdin and may return a
 * JSON response on stdout.
 *
 * For blocking events (pre-tool-call, pre-export) the response can
 * deny or modify the operation. For non-blocking events the response
 * is ignored — the script is fire-and-forget.
 *
 * The engine never throws. All errors are caught and logged so hook
 * failures cannot crash the agent runtime.
 */
export class HooksEngine {
  private hooks: Map<string, HookEntry[]>;

  constructor(hooks: Map<string, HookEntry[]>) {
    this.hooks = hooks;
  }

  /**
   * Emit an event. Returns a HookResponse if a blocking hook denies
   * or modifies the operation; null otherwise.
   */
  async emit(
    event: HookEventName,
    payload: HookPayload,
  ): Promise<HookResponse | null> {
    const entries = this.hooks.get(event);
    if (!entries || entries.length === 0) return null;

    const isBlocking = BLOCKING_EVENTS.has(event);

    // Filter by matcher if present
    const matched = entries.filter((e) =>
      matchesFilter(e.matcher, payload.tool, payload.command),
    );
    if (matched.length === 0) return null;

    let mergedModifiedInput: unknown = undefined;
    let lastMessage: string | undefined;

    for (const entry of matched) {
      try {
        const response = await executeScript(entry, payload);

        if (!response) continue;

        if (isBlocking && response.decision === "deny") {
          return response;
        }

        if (response.modified_input !== undefined) {
          mergedModifiedInput =
            mergedModifiedInput !== undefined
              ? {
                  ...(mergedModifiedInput as Record<string, unknown>),
                  ...(response.modified_input as Record<string, unknown>),
                }
              : response.modified_input;
        }

        if (response.message !== undefined) {
          lastMessage = response.message;
        }
      } catch {
        // Hook failures are swallowed — never crash the runtime
      }
    }

    if (!isBlocking) return null;

    if (mergedModifiedInput === undefined && lastMessage === undefined) {
      return null;
    }
    return {
      decision: "allow",
      ...(mergedModifiedInput !== undefined && {
        modified_input: mergedModifiedInput,
      }),
      ...(lastMessage !== undefined && { message: lastMessage }),
    };
  }

  /** Check if any hooks are registered for the given event. */
  hasHooks(event: HookEventName): boolean {
    const entries = this.hooks.get(event);
    return !!entries && entries.length > 0;
  }
}

// ─── File Detection ──────────────────────────────────────────

const VISUAL_FILE_EXTENSIONS =
  /\.(png|jpg|jpeg|webp|gif|svg|bmp|tiff|mp4|mov|avi|mkv|webm|mp3|wav|flac)(?:\s|$|")/gi;

/**
 * Detect generated visual asset file paths from a command + its stdout.
 * Used by HooksMiddleware to decide whether to emit `post-generate`.
 */
export function detectGeneratedFiles(
  command: string,
  stdout: string,
): string[] {
  const combined = command + "\n" + stdout;
  const matches = combined.match(VISUAL_FILE_EXTENSIONS);
  if (!matches) return [];

  // Extract full path tokens containing the matched extension
  const paths: string[] = [];
  for (const line of combined.split("\n")) {
    for (const token of line.split(/\s+/)) {
      const cleaned = token.replace(/^["']|["']$/g, "");
      if (VISUAL_FILE_EXTENSIONS.test(cleaned)) {
        paths.push(cleaned);
      }
      // Reset regex lastIndex (global flag)
      VISUAL_FILE_EXTENSIONS.lastIndex = 0;
    }
  }
  return [...new Set(paths)];
}

// ─── Script Execution ────────────────────────────────────────

function executeScript(
  entry: HookEntry,
  payload: HookPayload,
): Promise<HookResponse | null> {
  const timeout = entry.timeout ?? DEFAULT_TIMEOUT;

  return new Promise<HookResponse | null>((resolve) => {
    const proc = spawn(entry.command, {
      shell: true,
      stdio: ["pipe", "pipe", "pipe"],
      cwd: payload.cwd,
    });

    let stdout = "";
    let settled = false;

    const finish = (result: HookResponse | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      finish(null);
    }, timeout);

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.on("error", () => finish(null));

    proc.on("close", (code) => {
      if (code !== 0) {
        finish(null);
        return;
      }
      try {
        finish(JSON.parse(stdout) as HookResponse);
      } catch {
        finish(null);
      }
    });

    // Guard against EPIPE if the child exits before we finish writing
    proc.stdin.on("error", () => {});
    try {
      proc.stdin.write(JSON.stringify(payload));
      proc.stdin.end();
    } catch {
      // Child already exited — finish() will handle it via the close event
    }
  });
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Check if a hook entry's matcher passes for a given tool / command.
 * - No matcher → always matches
 * - Matcher is a pipe-separated list of tool names ("run_command|write_file")
 * - Or a glob pattern for command strings ("comfyui-cli *")
 */
function matchesFilter(
  matcher: string | undefined,
  toolName?: string,
  command?: string,
): boolean {
  if (!matcher) return true;

  // Tool name match (pipe-separated list)
  if (toolName && matcher.includes("|")) {
    return matcher.split("|").includes(toolName);
  }
  if (toolName && matcher === toolName) return true;

  // Glob match against command string
  if (command) {
    const escaped = matcher.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      "^" + escaped.replace(/\*/g, ".*") + "$",
    );
    return regex.test(command);
  }

  // Tool name simple match
  return toolName === matcher;
}
