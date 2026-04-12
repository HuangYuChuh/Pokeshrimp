import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { HooksEngine } from "@/core/hooks/engine";
import type { HookEntry, HookEventName } from "@/core/hooks/types";

let tmpDirs: string[] = [];

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hooks-test-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tmpDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tmpDirs = [];
});

function makeEngine(
  hooks: Record<string, HookEntry[]>,
): HooksEngine {
  const map = new Map<string, HookEntry[]>(Object.entries(hooks));
  return new HooksEngine(map);
}

describe("HooksEngine", () => {
  it("emit with no hooks returns null", async () => {
    const engine = makeEngine({});
    const result = await engine.emit("pre-tool-call", {
      event: "pre-tool-call",
      cwd: "/tmp",
    });
    expect(result).toBeNull();
  });

  it("emit with no matching hooks returns null", async () => {
    const engine = makeEngine({
      "session-start": [{ command: "echo hi", timeout: 5000 }],
    });
    const result = await engine.emit("pre-tool-call", {
      event: "pre-tool-call",
      cwd: "/tmp",
    });
    expect(result).toBeNull();
  });

  it("non-blocking events return null even if hook produces output", async () => {
    const engine = makeEngine({
      "post-tool-call": [
        {
          command: 'echo \'{"decision":"deny","reason":"nope"}\'',
          timeout: 5000,
        },
      ],
    });
    const result = await engine.emit("post-tool-call", {
      event: "post-tool-call",
      cwd: "/tmp",
    });
    // post-tool-call is non-blocking, so result is always null
    expect(result).toBeNull();
  });

  it("blocking hook that allows returns null (no modifications)", async () => {
    const engine = makeEngine({
      "pre-tool-call": [
        {
          command: 'echo \'{"decision":"allow"}\'',
          timeout: 5000,
        },
      ],
    });
    const result = await engine.emit("pre-tool-call", {
      event: "pre-tool-call",
      cwd: "/tmp",
    });
    expect(result).toBeNull();
  });

  it("blocking hook that denies returns deny response", async () => {
    const engine = makeEngine({
      "pre-tool-call": [
        {
          command: 'echo \'{"decision":"deny","reason":"blocked by hook"}\'',
          timeout: 5000,
        },
      ],
    });
    const result = await engine.emit("pre-tool-call", {
      event: "pre-tool-call",
      cwd: "/tmp",
    });
    expect(result).not.toBeNull();
    expect(result!.decision).toBe("deny");
    expect(result!.reason).toBe("blocked by hook");
  });

  it("real hook script writes to tmp file", async () => {
    const dir = makeTmpDir();
    const markerFile = path.join(dir, "hook-ran.txt");
    const engine = makeEngine({
      "pre-tool-call": [
        {
          command: `echo '{"decision":"allow"}' && echo "hook executed" > "${markerFile}"`,
          timeout: 5000,
        },
      ],
    });

    await engine.emit("pre-tool-call", {
      event: "pre-tool-call",
      cwd: dir,
    });

    // Give a moment for file write
    await new Promise((r) => setTimeout(r, 100));
    expect(fs.existsSync(markerFile)).toBe(true);
    expect(fs.readFileSync(markerFile, "utf-8").trim()).toBe("hook executed");
  });

  it("timeout handling: hook that sleeps too long returns null", async () => {
    const engine = makeEngine({
      "pre-tool-call": [
        {
          command: "sleep 10 && echo '{\"decision\":\"deny\"}'",
          timeout: 200, // very short timeout
        },
      ],
    });
    const start = Date.now();
    const result = await engine.emit("pre-tool-call", {
      event: "pre-tool-call",
      cwd: "/tmp",
    });
    const elapsed = Date.now() - start;
    expect(result).toBeNull();
    // Should complete well before the sleep duration
    expect(elapsed).toBeLessThan(5000);
  });

  it("hasHooks returns true when hooks are registered", () => {
    const engine = makeEngine({
      "pre-tool-call": [{ command: "echo ok", timeout: 5000 }],
    });
    expect(engine.hasHooks("pre-tool-call")).toBe(true);
    expect(engine.hasHooks("session-start")).toBe(false);
  });

  it("hook with matcher filters by tool name", async () => {
    const engine = makeEngine({
      "pre-tool-call": [
        {
          command: 'echo \'{"decision":"deny","reason":"only for run_command"}\'',
          timeout: 5000,
          matcher: "run_command",
        },
      ],
    });

    // Should not match a different tool
    const r1 = await engine.emit("pre-tool-call", {
      event: "pre-tool-call",
      tool: "write_file",
      cwd: "/tmp",
    });
    expect(r1).toBeNull();

    // Should match run_command
    const r2 = await engine.emit("pre-tool-call", {
      event: "pre-tool-call",
      tool: "run_command",
      cwd: "/tmp",
    });
    expect(r2).not.toBeNull();
    expect(r2!.decision).toBe("deny");
  });

  it("hook script that exits non-zero returns null", async () => {
    const engine = makeEngine({
      "pre-tool-call": [
        {
          command: "exit 1",
          timeout: 5000,
        },
      ],
    });
    const result = await engine.emit("pre-tool-call", {
      event: "pre-tool-call",
      cwd: "/tmp",
    });
    expect(result).toBeNull();
  });
});
