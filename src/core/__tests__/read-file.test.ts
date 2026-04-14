import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { readFileTool } from "@/core/tool/builtin/read-file";
import type { ToolContext } from "@/core/tool/types";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pokeshrimp-readfile-test-"));
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

describe("readFileTool", () => {
  it("isReadOnly returns true", () => {
    expect(readFileTool.isReadOnly()).toBe(true);
  });

  it("checkPermissions always allows", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    const result = await readFileTool.checkPermissions({}, ctx(dir));
    expect(result.behavior).toBe("allow");
  });

  it("reads file within cwd", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    fs.writeFileSync(path.join(dir, "hello.txt"), "world");

    const result = await readFileTool.call({ path: "hello.txt" }, ctx(dir));
    expect(result.success).toBe(true);
    expect(result.data).toBe("world");
  });

  it("reads file with absolute path within cwd", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    const filePath = path.join(dir, "abs.txt");
    fs.writeFileSync(filePath, "absolute");

    const result = await readFileTool.call({ path: filePath }, ctx(dir));
    expect(result.success).toBe(true);
    expect(result.data).toBe("absolute");
  });

  it("rejects path outside cwd", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const result = await readFileTool.call({ path: "../../../etc/passwd" }, ctx(dir));
    expect(result.success).toBe(false);
    expect(result.error).toContain("outside the working directory");
  });

  it("returns error for nonexistent file", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const result = await readFileTool.call({ path: "nope.txt" }, ctx(dir));
    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to read file");
  });
});
