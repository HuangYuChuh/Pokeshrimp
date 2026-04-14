import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { runCommandTool } from "@/core/tool/builtin/run-command";
import type { ToolContext } from "@/core/tool/types";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pokeshrimp-runcmd-test-"));
}

function ctx(cwd: string): ToolContext {
  return { cwd };
}

const tmpDirs: string[] = [];
afterEach(() => {
  for (const dir of tmpDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tmpDirs.length = 0;
});

describe("runCommandTool", () => {
  it("isReadOnly returns false", () => {
    expect(runCommandTool.isReadOnly()).toBe(false);
  });

  it("isDestructive returns true", () => {
    expect(runCommandTool.isDestructive!()).toBe(true);
  });

  it("checkPermissions returns ask", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    const result = await runCommandTool.checkPermissions({}, ctx(dir));
    expect(result.behavior).toBe("ask");
  });

  it("executes simple command", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const result = await runCommandTool.call({ command: "echo hello" }, ctx(dir));
    expect(result.success).toBe(true);
    expect((result.data as string).trim()).toBe("hello");
  });

  it("returns error on non-zero exit code", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const result = await runCommandTool.call({ command: "exit 1" }, ctx(dir));
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("runs in specified cwd", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const result = await runCommandTool.call({ command: "pwd" }, ctx(dir));
    expect(result.success).toBe(true);
    // fs.realpathSync to handle macOS /private/var symlink
    expect(fs.realpathSync((result.data as string).trim())).toBe(fs.realpathSync(dir));
  });

  it("respects timeout", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const result = await runCommandTool.call({ command: "sleep 10", timeout: 200 }, ctx(dir));
    expect(result.success).toBe(false);
    expect(result.error).toContain("timed out");
  }, 5000);

  it("captures stderr on failure", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const result = await runCommandTool.call({ command: "echo error_msg >&2; exit 1" }, ctx(dir));
    expect(result.success).toBe(false);
    expect(result.error).toContain("error_msg");
  });
});
