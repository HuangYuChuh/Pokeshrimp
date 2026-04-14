import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { loadConfigFile, loadConfig, AppConfigSchema } from "@/core/config";

// --- Helpers ---

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "pokeshrimp-config-test-"));
}

function writeJSON(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data));
}

// --- Cleanup ---

const tmpDirs: string[] = [];
afterEach(() => {
  for (const dir of tmpDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tmpDirs.length = 0;
});

// --- AppConfigSchema ---

describe("AppConfigSchema", () => {
  it("provides defaults for empty object", () => {
    const config = AppConfigSchema.parse({});
    expect(config.defaultModel).toBe("claude-sonnet");
    expect(config.apiKeys).toEqual({});
    expect(config.permissions).toEqual({
      alwaysAllow: [],
      alwaysDeny: [],
      alwaysAsk: [],
    });
    expect(config.mcpServers).toEqual({});
    expect(config.hooks).toEqual({});
    expect(config.customProviders).toEqual({});
  });

  it("rejects invalid defaultModel type", () => {
    const result = AppConfigSchema.safeParse({ defaultModel: 123 });
    expect(result.success).toBe(false);
  });

  it("accepts valid full config", () => {
    const result = AppConfigSchema.safeParse({
      defaultModel: "gpt-4o",
      apiKeys: { anthropic: "sk-ant-xxx", openai: "sk-xxx" },
      permissions: {
        alwaysAllow: ["ls *"],
        alwaysDeny: ["rm -rf *"],
        alwaysAsk: [],
      },
    });
    expect(result.success).toBe(true);
  });
});

// --- loadConfigFile ---

describe("loadConfigFile", () => {
  it("returns empty object for nonexistent file", () => {
    expect(loadConfigFile("/tmp/nonexistent-pokeshrimp-config.json")).toEqual({});
  });

  it("returns empty object for invalid JSON", () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    const filePath = path.join(dir, "bad.json");
    fs.writeFileSync(filePath, "not json{{{");
    expect(loadConfigFile(filePath)).toEqual({});
  });

  it("returns empty object for schema-invalid data", () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    const filePath = path.join(dir, "bad-schema.json");
    writeJSON(filePath, { defaultModel: 999, apiKeys: "not-an-object" });
    expect(loadConfigFile(filePath)).toEqual({});
  });

  it("parses valid partial config", () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    const filePath = path.join(dir, "config.json");
    writeJSON(filePath, { defaultModel: "gpt-4o" });
    const result = loadConfigFile(filePath);
    expect(result.defaultModel).toBe("gpt-4o");
  });
});

// --- loadConfig (three-level merge) ---

describe("loadConfig", () => {
  it("returns defaults when no config files exist", () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);
    const config = loadConfig(dir);
    expect(config.defaultModel).toBe("claude-sonnet");
  });

  it("project config overrides global config", () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    // Simulate global config by writing to project dir
    // (we can't write to real ~/.visagent in tests, so test the merge logic
    //  by writing project + local configs)
    const projectConfigDir = path.join(dir, ".visagent");
    writeJSON(path.join(projectConfigDir, "config.json"), {
      defaultModel: "gpt-4o",
      permissions: { alwaysAllow: ["ls *"] },
    });

    const config = loadConfig(dir);
    expect(config.defaultModel).toBe("gpt-4o");
    expect(config.permissions.alwaysAllow).toEqual(["ls *"]);
  });

  it("local config overrides project config", () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const configDir = path.join(dir, ".visagent");
    writeJSON(path.join(configDir, "config.json"), {
      defaultModel: "gpt-4o",
    });
    writeJSON(path.join(configDir, "config.local.json"), {
      defaultModel: "claude-opus",
    });

    const config = loadConfig(dir);
    expect(config.defaultModel).toBe("claude-opus");
  });

  it("deep merges nested objects", () => {
    const dir = makeTmpDir();
    tmpDirs.push(dir);

    const configDir = path.join(dir, ".visagent");
    writeJSON(path.join(configDir, "config.json"), {
      apiKeys: { anthropic: "sk-ant-xxx" },
    });
    writeJSON(path.join(configDir, "config.local.json"), {
      apiKeys: { openai: "sk-xxx" },
    });

    const config = loadConfig(dir);
    expect(config.apiKeys.anthropic).toBe("sk-ant-xxx");
    expect(config.apiKeys.openai).toBe("sk-xxx");
  });
});
