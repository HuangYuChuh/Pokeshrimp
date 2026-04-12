import { describe, it, expect } from "vitest";
import {
  runMiddlewaresBefore,
  runMiddlewaresAfter,
  createLoopDetectionMiddleware,
  createCommandApprovalMiddleware,
  type Middleware,
  type MiddlewareAction,
} from "@/core/agent/middleware";

function makeMw(
  name: string,
  beforeFn?: (
    toolName: string,
    input: unknown,
  ) => Promise<MiddlewareAction>,
  afterFn?: (toolName: string, input: unknown, result: unknown) => Promise<void>,
): Middleware {
  return {
    name,
    ...(beforeFn && { before: beforeFn }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(afterFn && { after: afterFn as any }),
  };
}

describe("runMiddlewaresBefore", () => {
  it("continue passes through", async () => {
    const mw = makeMw("pass", async () => ({ action: "continue" }));
    const result = await runMiddlewaresBefore([mw], "test", { data: 1 });
    expect(result.allowed).toBe(true);
    expect(result.input).toEqual({ data: 1 });
  });

  it("deny blocks execution", async () => {
    const mw = makeMw("block", async () => ({
      action: "deny",
      reason: "not allowed",
    }));
    const result = await runMiddlewaresBefore([mw], "test", {});
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("not allowed");
  });

  it("skip moves to next middleware", async () => {
    const calls: string[] = [];
    const mw1 = makeMw("skipper", async () => {
      calls.push("mw1");
      return { action: "skip" };
    });
    const mw2 = makeMw("runner", async () => {
      calls.push("mw2");
      return { action: "continue" };
    });
    const result = await runMiddlewaresBefore([mw1, mw2], "test", {});
    expect(result.allowed).toBe(true);
    expect(calls).toEqual(["mw1", "mw2"]);
  });

  it("continue with input rewrites the input", async () => {
    const mw = makeMw("rewriter", async () => ({
      action: "continue",
      input: { data: "rewritten" },
    }));
    const result = await runMiddlewaresBefore([mw], "test", { data: "original" });
    expect(result.input).toEqual({ data: "rewritten" });
  });

  it("first deny stops the chain", async () => {
    const calls: string[] = [];
    const mw1 = makeMw("denier", async () => {
      calls.push("mw1");
      return { action: "deny", reason: "blocked" };
    });
    const mw2 = makeMw("never", async () => {
      calls.push("mw2");
      return { action: "continue" };
    });
    const result = await runMiddlewaresBefore([mw1, mw2], "test", {});
    expect(result.allowed).toBe(false);
    expect(calls).toEqual(["mw1"]);
  });

  it("middlewares without before are skipped", async () => {
    const mw = { name: "noop" } as Middleware;
    const result = await runMiddlewaresBefore([mw], "test", { x: 1 });
    expect(result.allowed).toBe(true);
  });
});

describe("runMiddlewaresAfter", () => {
  it("all after hooks are called", async () => {
    const calls: string[] = [];
    const mw1 = makeMw("a", undefined, async () => {
      calls.push("a");
    });
    const mw2 = makeMw("b", undefined, async () => {
      calls.push("b");
    });
    await runMiddlewaresAfter([mw1, mw2], "test", {}, {
      success: true,
      data: "ok",
    });
    expect(calls).toEqual(["a", "b"]);
  });

  it("middlewares without after are skipped", async () => {
    const mw = { name: "noop" } as Middleware;
    // Should not throw
    await runMiddlewaresAfter([mw], "test", {}, { success: true, data: "ok" });
  });
});

describe("LoopDetection middleware", () => {
  it("allows initial calls", async () => {
    const mw = createLoopDetectionMiddleware(3);
    const result = await mw.before!("tool", { x: 1 });
    expect(result.action).toBe("continue");
  });

  it("denies after N repeats of same tool+input", async () => {
    const mw = createLoopDetectionMiddleware(3);
    await mw.before!("tool", { x: 1 });
    await mw.before!("tool", { x: 1 });
    const result = await mw.before!("tool", { x: 1 });
    expect(result.action).toBe("deny");
    expect((result as { reason: string }).reason).toContain("Loop detected");
  });

  it("different inputs do not trigger loop detection", async () => {
    const mw = createLoopDetectionMiddleware(3);
    await mw.before!("tool", { x: 1 });
    await mw.before!("tool", { x: 2 });
    await mw.before!("tool", { x: 3 });
    const result = await mw.before!("tool", { x: 4 });
    expect(result.action).toBe("continue");
  });

  it("different tool names do not trigger loop detection", async () => {
    const mw = createLoopDetectionMiddleware(3);
    await mw.before!("tool_a", { x: 1 });
    await mw.before!("tool_b", { x: 1 });
    await mw.before!("tool_c", { x: 1 });
    const result = await mw.before!("tool_d", { x: 1 });
    expect(result.action).toBe("continue");
  });
});

describe("CommandApproval middleware", () => {
  it("allows whitelisted commands", async () => {
    const mw = createCommandApprovalMiddleware({
      alwaysAllow: ["ls *", "cat *"],
      alwaysDeny: ["rm -rf *"],
    });
    const result = await mw.before!("run_command", { command: "ls -la" });
    expect(result.action).toBe("continue");
  });

  it("denies blacklisted commands", async () => {
    const mw = createCommandApprovalMiddleware({
      alwaysAllow: ["ls *"],
      alwaysDeny: ["rm -rf *"],
    });
    const result = await mw.before!("run_command", { command: "rm -rf /tmp" });
    expect(result.action).toBe("deny");
  });

  it("ignores non-run_command tools", async () => {
    const mw = createCommandApprovalMiddleware({
      alwaysAllow: [],
      alwaysDeny: ["*"],
    });
    const result = await mw.before!("write_file", { path: "/tmp/x" });
    expect(result.action).toBe("continue");
  });

  it("unmatched commands with no approval channel are allowed", async () => {
    const mw = createCommandApprovalMiddleware({
      alwaysAllow: [],
      alwaysDeny: [],
    });
    // No approval channel provided, so "ask" decision falls through to allow
    const result = await mw.before!("run_command", { command: "python script.py" });
    expect(result.action).toBe("continue");
  });

  it("deny takes priority over allow in classification", async () => {
    const mw = createCommandApprovalMiddleware({
      alwaysAllow: ["sudo *"],
      alwaysDeny: ["sudo *"],
    });
    const result = await mw.before!("run_command", { command: "sudo ls" });
    expect(result.action).toBe("deny");
  });
});
