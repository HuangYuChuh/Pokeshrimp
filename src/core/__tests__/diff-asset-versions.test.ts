import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { diffAssetVersionsTool } from "@/core/tool/builtin/diff-asset-versions";
import { VersionHistory } from "@/core/designfile/history";
import type { ToolContext } from "@/core/tool/types";

let tmpDirs: string[] = [];

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "diff-tool-test-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tmpDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tmpDirs = [];
});

/**
 * Set up a project dir with a designfile and two asset versions
 * recorded in .visagent/.history.
 */
function setupProject(opts?: { skipSecondVersion?: boolean }): {
  cwd: string;
  context: ToolContext;
} {
  const cwd = makeTmpDir();
  const visagentDir = path.join(cwd, ".visagent");
  fs.mkdirSync(visagentDir, { recursive: true });

  // Minimal designfile.yaml
  fs.writeFileSync(
    path.join(visagentDir, "designfile.yaml"),
    [
      "brand: TestBrand",
      "assets:",
      "  logo:",
      "    skill: /logo-design",
      "    params:",
      "      style: minimalist",
      "      color: red",
    ].join("\n") + "\n",
  );

  // Record versions via the history module directly
  const historyDir = path.join(visagentDir, ".history");
  const history = new VersionHistory(historyDir);

  history.record("logo", {
    skill: "/logo-design",
    params: { style: "modern", color: "blue", size: 512 },
    outputFiles: [],
  });

  if (!opts?.skipSecondVersion) {
    history.record("logo", {
      skill: "/logo-design",
      params: { style: "minimalist", color: "red" },
      outputFiles: [],
    });
  }

  return { cwd, context: { cwd } };
}

describe("diff_asset_versions tool", () => {
  it("diffs the two most recent versions when no hashes provided", async () => {
    const { context } = setupProject();

    const result = await diffAssetVersionsTool.call({ asset: "logo" }, context);

    expect(result.success).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.asset).toBe("logo");

    // v1 had {style: modern, color: blue, size: 512}
    // v2 has {style: minimalist, color: red}
    // Diff from v1 -> v2: style changed, color changed, size removed
    expect(data.changed).toEqual({
      style: { from: "modern", to: "minimalist" },
      color: { from: "blue", to: "red" },
    });
    expect(data.removed).toEqual({ size: 512 });
    expect(data.added).toEqual({});

    // Summary should mention the changes
    const summary = data.summary as string;
    expect(summary).toContain("style changed");
    expect(summary).toContain("color changed");
    expect(summary).toContain("size removed");
  });

  it("diffs two specific versions by hash", async () => {
    const { cwd, context } = setupProject();

    // Get the hashes from the history
    const historyDir = path.join(cwd, ".visagent", ".history");
    const history = new VersionHistory(historyDir);
    const versions = history.listVersions("logo");
    expect(versions.length).toBe(2);

    const hashA = versions[1].hash; // older
    const hashB = versions[0].hash; // newer

    const result = await diffAssetVersionsTool.call({ asset: "logo", hashA, hashB }, context);

    expect(result.success).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.hashA).toBe(hashA);
    expect(data.hashB).toBe(hashB);
    expect(data.changed).toEqual({
      style: { from: "modern", to: "minimalist" },
      color: { from: "blue", to: "red" },
    });
  });

  it("returns error when only one version exists", async () => {
    const { context } = setupProject({ skipSecondVersion: true });

    const result = await diffAssetVersionsTool.call({ asset: "logo" }, context);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Only one version");
  });

  it("returns error when no versions exist", async () => {
    const cwd = makeTmpDir();
    const visagentDir = path.join(cwd, ".visagent");
    fs.mkdirSync(visagentDir, { recursive: true });
    fs.writeFileSync(
      path.join(visagentDir, "designfile.yaml"),
      "brand: TestBrand\nassets:\n  banner:\n    skill: /banner-gen\n    params: {}\n",
    );

    const result = await diffAssetVersionsTool.call({ asset: "banner" }, { cwd });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No recorded versions");
  });

  it("returns error when hash not found", async () => {
    const { context } = setupProject();

    const result = await diffAssetVersionsTool.call(
      { asset: "logo", hashA: "deadbeef0000", hashB: "badc0ffee000" },
      context,
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Could not find one or both versions");
  });

  it("returns error when no designfile exists", async () => {
    const cwd = makeTmpDir();

    const result = await diffAssetVersionsTool.call({ asset: "logo" }, { cwd });

    expect(result.success).toBe(false);
    expect(result.error).toContain("No designfile.yaml");
  });

  it("shows no differences when versions have identical params", async () => {
    const cwd = makeTmpDir();
    const visagentDir = path.join(cwd, ".visagent");
    fs.mkdirSync(visagentDir, { recursive: true });
    fs.writeFileSync(
      path.join(visagentDir, "designfile.yaml"),
      "brand: TestBrand\nassets:\n  icon:\n    skill: /icon-gen\n    params:\n      color: green\n",
    );

    const historyDir = path.join(visagentDir, ".history");
    const history = new VersionHistory(historyDir);

    // We need different hashes, so use slightly different skills
    history.record("icon", {
      skill: "/icon-gen-v1",
      params: { color: "green" },
      outputFiles: [],
    });
    history.record("icon", {
      skill: "/icon-gen-v2",
      params: { color: "green" },
      outputFiles: [],
    });

    const result = await diffAssetVersionsTool.call({ asset: "icon" }, { cwd });

    expect(result.success).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data.added).toEqual({});
    expect(data.removed).toEqual({});
    expect(data.changed).toEqual({});
    expect(data.summary).toBe("No parameter differences.");
  });
});
