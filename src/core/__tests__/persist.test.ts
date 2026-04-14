import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { persistAlwaysAllow, derivePattern } from "@/core/permission/persist";

// --- Helpers ---

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pokeshrimp-persist-test-"));
}

function writeJSON(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data));
}

function readJSON(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// --- Cleanup ---

const tmpDirs: string[] = [];
afterEach(() => {
  for (const dir of tmpDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tmpDirs.length = 0;
});

// --- derivePattern ---

describe("derivePattern", () => {
  it("binary with subcommand", () => {
    expect(derivePattern("comfyui-cli generate --workflow foo")).toBe("comfyui-cli generate *");
  });

  it("binary with flag as second token", () => {
    expect(derivePattern("ffmpeg -i input.mp4 output.mp4")).toBe("ffmpeg *");
  });

  it("single binary", () => {
    expect(derivePattern("rembg")).toBe("rembg *");
  });

  it("binary with simple argument", () => {
    expect(derivePattern("rembg input.png output.png")).toBe("rembg input.png *");
  });

  it("trims whitespace", () => {
    expect(derivePattern("  ls -la  ")).toBe("ls *");
  });
});

// --- persistAlwaysAllow ---

describe("persistAlwaysAllow", () => {
  it("creates config file when none exists", () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    persistAlwaysAllow("ls *", dir);

    const configPath = path.join(dir, ".visagent", "config.json");
    const config = readJSON(configPath) as Record<string, unknown>;
    const perms = config.permissions as Record<string, unknown>;
    expect(perms.alwaysAllow).toEqual(["ls *"]);
  });

  it("appends to existing alwaysAllow array", () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const configPath = path.join(dir, ".visagent", "config.json");
    writeJSON(configPath, {
      permissions: { alwaysAllow: ["cat *"] },
    });

    persistAlwaysAllow("ls *", dir);

    const config = readJSON(configPath) as Record<string, unknown>;
    const perms = config.permissions as Record<string, unknown>;
    expect(perms.alwaysAllow).toEqual(["cat *", "ls *"]);
  });

  it("does not duplicate existing pattern", () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const configPath = path.join(dir, ".visagent", "config.json");
    writeJSON(configPath, {
      permissions: { alwaysAllow: ["ls *"] },
    });

    persistAlwaysAllow("ls *", dir);

    const config = readJSON(configPath) as Record<string, unknown>;
    const perms = config.permissions as Record<string, unknown>;
    expect(perms.alwaysAllow).toEqual(["ls *"]);
  });

  it("preserves other config fields", () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const configPath = path.join(dir, ".visagent", "config.json");
    writeJSON(configPath, {
      defaultModel: "gpt-4o",
      permissions: { alwaysAllow: [] },
    });

    persistAlwaysAllow("ls *", dir);

    const config = readJSON(configPath) as Record<string, unknown>;
    expect(config.defaultModel).toBe("gpt-4o");
  });

  it("handles invalid JSON in existing file", () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const configDir = path.join(dir, ".visagent");
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, "config.json"), "not json{{{");

    persistAlwaysAllow("ls *", dir);

    const config = readJSON(path.join(configDir, "config.json")) as Record<string, unknown>;
    const perms = config.permissions as Record<string, unknown>;
    expect(perms.alwaysAllow).toEqual(["ls *"]);
  });
});
