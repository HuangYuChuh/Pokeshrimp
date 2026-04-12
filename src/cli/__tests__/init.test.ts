import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, rmSync, readFileSync, realpathSync } from "fs";
import { join } from "path";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { runInit } from "@/cli/init";

describe("runInit", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = realpathSync(mkdtempSync(join(tmpdir(), "pokeshrimp-init-test-")));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates .visagent directory structure", () => {
    const result = runInit({ targetDir: tempDir });

    expect(result.visagentDir).toBe(join(tempDir, ".visagent"));
    expect(existsSync(join(tempDir, ".visagent"))).toBe(true);
    expect(existsSync(join(tempDir, ".visagent", "skills"))).toBe(true);
    expect(existsSync(join(tempDir, ".visagent", "hooks"))).toBe(true);
  });

  it("creates config.json with sensible defaults", () => {
    runInit({ targetDir: tempDir });

    const configPath = join(tempDir, ".visagent", "config.json");
    expect(existsSync(configPath)).toBe(true);

    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    expect(config.defaultModel).toBe("claude-sonnet");
    expect(config.permissions.alwaysDeny).toContain("rm -rf *");
    expect(config.permissions.alwaysDeny).toContain("sudo *");
    expect(config.permissions.alwaysAllow).toEqual([]);
    expect(config.permissions.alwaysAsk).toEqual([]);
  });

  it("creates designfile.yaml", () => {
    runInit({ targetDir: tempDir });

    const designfilePath = join(tempDir, ".visagent", "designfile.yaml");
    expect(existsSync(designfilePath)).toBe(true);

    const content = readFileSync(designfilePath, "utf-8");
    expect(content).toContain("brand: My Project");
    expect(content).toContain("assets: {}");
  });

  it("creates skills/README.md", () => {
    runInit({ targetDir: tempDir });

    const readmePath = join(tempDir, ".visagent", "skills", "README.md");
    expect(existsSync(readmePath)).toBe(true);

    const content = readFileSync(readmePath, "utf-8");
    expect(content).toContain(".skill.md");
  });

  it("returns list of created entries", () => {
    const result = runInit({ targetDir: tempDir });

    expect(result.created).toContain(".visagent/");
    expect(result.created).toContain(".visagent/skills/");
    expect(result.created).toContain(".visagent/hooks/");
    expect(result.created).toContain(".visagent/config.json");
    expect(result.created).toContain(".visagent/designfile.yaml");
    expect(result.created).toContain(".visagent/skills/README.md");
  });

  it("throws if .visagent already exists", () => {
    mkdirSync(join(tempDir, ".visagent"));

    expect(() => runInit({ targetDir: tempDir })).toThrow(
      ".visagent/ already exists",
    );
  });

  it("uses cwd when no targetDir provided", () => {
    const originalCwd = process.cwd();
    try {
      process.chdir(tempDir);
      const result = runInit();
      expect(result.visagentDir).toBe(join(tempDir, ".visagent"));
    } finally {
      process.chdir(originalCwd);
    }
  });
});
