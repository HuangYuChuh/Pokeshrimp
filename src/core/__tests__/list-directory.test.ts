import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { listDirectoryTool } from "@/core/tool/builtin/list-directory";
import type { ToolContext } from "@/core/tool/types";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pokeshrimp-listdir-test-"));
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

describe("listDirectoryTool", () => {
  it("isReadOnly returns true", () => {
    expect(listDirectoryTool.isReadOnly()).toBe(true);
  });

  it("lists files and directories", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    fs.writeFileSync(path.join(dir, "file.txt"), "content");
    fs.mkdirSync(path.join(dir, "subdir"));

    const result = await listDirectoryTool.call({ path: "." }, ctx(dir));
    expect(result.success).toBe(true);

    const items = result.data as { name: string; type: string }[];
    const file = items.find((i) => i.name === "file.txt");
    const subdir = items.find((i) => i.name === "subdir");
    expect(file).toEqual({ name: "file.txt", type: "file" });
    expect(subdir).toEqual({ name: "subdir", type: "directory" });
  });

  it("rejects path outside cwd", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const result = await listDirectoryTool.call({ path: "../../.." }, ctx(dir));
    expect(result.success).toBe(false);
    expect(result.error).toContain("outside the working directory");
  });

  it("returns error for nonexistent directory", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const result = await listDirectoryTool.call({ path: "nope" }, ctx(dir));
    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to list directory");
  });

  it("lists empty directory", async () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const result = await listDirectoryTool.call({ path: "." }, ctx(dir));
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });
});
