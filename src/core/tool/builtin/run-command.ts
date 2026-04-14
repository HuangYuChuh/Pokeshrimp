import { z } from "zod";
import { spawn } from "child_process";
import type { Tool, ToolContext, ToolResult, PermissionResult } from "../types";

const inputSchema = z.object({
  command: z.string().describe("Shell command to execute"),
  timeout: z.number().optional().describe("Maximum runtime in milliseconds (default 30000)"),
});

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_BYTES = 1_000_000;

export const runCommandTool: Tool = {
  name: "run_command",
  description: "Execute a shell command and return its stdout/stderr.",
  inputSchema,
  isBuiltin: true,

  isReadOnly() {
    return false;
  },

  isDestructive() {
    return true;
  },

  async checkPermissions(): Promise<PermissionResult> {
    // The CommandApprovalMiddleware enforces allow/deny lists.
    // This tool delegates approval to the middleware chain.
    return { behavior: "ask" };
  },

  call(input: unknown, context: ToolContext): Promise<ToolResult> {
    const { command, timeout } = input as z.infer<typeof inputSchema>;
    const timeoutMs = timeout ?? DEFAULT_TIMEOUT_MS;

    return new Promise<ToolResult>((resolve) => {
      const proc = spawn(command, {
        shell: true,
        cwd: context.cwd,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";
      let stdoutBytes = 0;
      let stderrBytes = 0;
      let truncated = false;
      let settled = false;

      const finish = (result: ToolResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (context.signal) {
          context.signal.removeEventListener("abort", onAbort);
        }
        resolve(result);
      };

      const timer = setTimeout(() => {
        proc.kill("SIGKILL");
        finish({
          success: false,
          data: stdout || null,
          error: `Command timed out after ${timeoutMs}ms: ${command}`,
        });
      }, timeoutMs);

      const onAbort = () => {
        proc.kill("SIGTERM");
        finish({
          success: false,
          data: stdout || null,
          error: "Command aborted by caller",
        });
      };

      if (context.signal) {
        if (context.signal.aborted) {
          onAbort();
          return;
        }
        context.signal.addEventListener("abort", onAbort);
      }

      proc.stdout.on("data", (chunk: Buffer) => {
        stdoutBytes += chunk.length;
        if (stdoutBytes > MAX_OUTPUT_BYTES) {
          truncated = true;
          return;
        }
        stdout += chunk.toString("utf-8");
      });

      proc.stderr.on("data", (chunk: Buffer) => {
        stderrBytes += chunk.length;
        if (stderrBytes > MAX_OUTPUT_BYTES) {
          truncated = true;
          return;
        }
        stderr += chunk.toString("utf-8");
      });

      proc.on("error", (err) => {
        finish({
          success: false,
          data: null,
          error: err.message,
        });
      });

      proc.on("close", (code) => {
        const suffix = truncated ? "\n[output truncated]" : "";
        if (code === 0) {
          finish({ success: true, data: stdout + suffix });
        } else {
          finish({
            success: false,
            data: stdout || null,
            error: (stderr || `Command exited with code ${code}`) + suffix,
          });
        }
      });
    });
  },
};
