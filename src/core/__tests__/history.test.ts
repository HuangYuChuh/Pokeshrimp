import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { VersionHistory } from "@/core/designfile/history";

let tmpDirs: string[] = [];

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "history-test-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tmpDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tmpDirs = [];
});

describe("VersionHistory", () => {
  it("record a version and retrieve by hash", () => {
    const dir = makeTmpDir();
    const history = new VersionHistory(dir);
    const version = history.record("logo", {
      skill: "/logo-design",
      params: { color: "red", size: 512 },
      outputFiles: ["/out/logo.png"],
    });
    expect(version.hash).toBeTruthy();
    expect(version.skill).toBe("/logo-design");

    const retrieved = history.getVersion("logo", version.hash);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.hash).toBe(version.hash);
    expect(retrieved!.params).toEqual({ color: "red", size: 512 });
  });

  it("list versions returns newest first", () => {
    const dir = makeTmpDir();
    const history = new VersionHistory(dir);

    const v1 = history.record("logo", {
      skill: "/logo-design",
      params: { color: "red" },
      outputFiles: [],
    });

    // Record a second version with different params (different hash)
    const v2 = history.record("logo", {
      skill: "/logo-design",
      params: { color: "blue" },
      outputFiles: [],
    });

    const versions = history.listVersions("logo");
    expect(versions.length).toBe(2);
    // Newest first
    expect(
      new Date(versions[0].timestamp).getTime(),
    ).toBeGreaterThanOrEqual(new Date(versions[1].timestamp).getTime());
  });

  it("param diffing detects added keys", () => {
    const dir = makeTmpDir();
    const history = new VersionHistory(dir);

    const v1 = history.record("logo", {
      skill: "/logo-design",
      params: { color: "red" },
      outputFiles: [],
    });
    const v2 = history.record("logo", {
      skill: "/logo-design",
      params: { color: "red", size: 512 },
      outputFiles: [],
    });

    const diff = history.diffParams(v1, v2);
    expect(diff.added).toEqual({ size: 512 });
    expect(Object.keys(diff.removed)).toHaveLength(0);
    expect(Object.keys(diff.changed)).toHaveLength(0);
  });

  it("param diffing detects removed keys", () => {
    const dir = makeTmpDir();
    const history = new VersionHistory(dir);

    const v1 = history.record("logo", {
      skill: "/logo-design",
      params: { color: "red", size: 512 },
      outputFiles: [],
    });
    const v2 = history.record("logo", {
      skill: "/logo-design",
      params: { color: "red" },
      outputFiles: [],
    });

    const diff = history.diffParams(v1, v2);
    expect(diff.removed).toEqual({ size: 512 });
  });

  it("param diffing detects changed values", () => {
    const dir = makeTmpDir();
    const history = new VersionHistory(dir);

    const v1 = history.record("logo", {
      skill: "/logo-design",
      params: { color: "red" },
      outputFiles: [],
    });
    const v2 = history.record("logo", {
      skill: "/logo-design",
      params: { color: "blue" },
      outputFiles: [],
    });

    const diff = history.diffParams(v1, v2);
    expect(diff.changed).toEqual({ color: { from: "red", to: "blue" } });
  });

  it("deterministic hash: same params produce same hash", () => {
    const dir = makeTmpDir();
    const history = new VersionHistory(dir);

    const v1 = history.record("logo", {
      skill: "/logo-design",
      params: { color: "red", size: 512 },
      outputFiles: [],
    });
    const v2 = history.record("logo", {
      skill: "/logo-design",
      params: { size: 512, color: "red" }, // different key order
      outputFiles: [],
    });

    expect(v1.hash).toBe(v2.hash);
  });

  it("missing asset returns empty array", () => {
    const dir = makeTmpDir();
    const history = new VersionHistory(dir);
    expect(history.listVersions("nonexistent")).toEqual([]);
  });

  it("getVersion returns null for nonexistent hash", () => {
    const dir = makeTmpDir();
    const history = new VersionHistory(dir);
    expect(history.getVersion("logo", "deadbeef")).toBeNull();
  });

  it("records command when provided", () => {
    const dir = makeTmpDir();
    const history = new VersionHistory(dir);
    const version = history.record("logo", {
      skill: "/logo-design",
      params: { color: "red" },
      command: "comfyui-cli generate --color red",
      outputFiles: ["/out/logo.png"],
    });
    expect(version.command).toBe("comfyui-cli generate --color red");
  });

  // ─── Content-addressable file storage ───────────────────

  it("copies output files into content-addressable storage", () => {
    const dir = makeTmpDir();
    const history = new VersionHistory(dir);

    // Create a temp output file
    const outDir = makeTmpDir();
    const outFile = path.join(outDir, "logo.png");
    fs.writeFileSync(outFile, "fake-png-content");

    const version = history.record("logo", {
      skill: "/logo-design",
      params: { color: "red" },
      outputFiles: [outFile],
    });

    expect(version.storedFiles).toBeDefined();
    expect(version.storedFiles!.length).toBe(1);
    expect(version.storedFiles![0].originalPath).toBe(outFile);
    expect(version.storedFiles![0].contentHash).toHaveLength(12);

    // Verify the file was actually copied
    const storedPath = version.storedFiles![0].storedPath;
    expect(fs.existsSync(storedPath)).toBe(true);
    expect(fs.readFileSync(storedPath, "utf-8")).toBe("fake-png-content");
  });

  it("deduplicates files with the same content hash", () => {
    const dir = makeTmpDir();
    const history = new VersionHistory(dir);

    const outDir = makeTmpDir();
    const file1 = path.join(outDir, "logo-v1.png");
    const file2 = path.join(outDir, "logo-v2.png");
    fs.writeFileSync(file1, "same-content");
    fs.writeFileSync(file2, "same-content");

    const v1 = history.record("logo", {
      skill: "/logo-design",
      params: { color: "red" },
      outputFiles: [file1],
    });
    const v2 = history.record("logo", {
      skill: "/logo-design",
      params: { color: "blue" },
      outputFiles: [file2],
    });

    // Same content hash
    expect(v1.storedFiles![0].contentHash).toBe(v2.storedFiles![0].contentHash);

    // Both stored paths are under the same hash directory
    const hashDir = path.dirname(v1.storedFiles![0].storedPath);
    expect(path.dirname(v2.storedFiles![0].storedPath)).toBe(hashDir);
  });

  it("skips missing output files gracefully", () => {
    const dir = makeTmpDir();
    const history = new VersionHistory(dir);

    const version = history.record("logo", {
      skill: "/logo-design",
      params: { color: "red" },
      outputFiles: ["/nonexistent/path/logo.png"],
    });

    // Should not have storedFiles (or empty)
    expect(version.storedFiles).toBeUndefined();
    expect(version.outputFiles).toEqual(["/nonexistent/path/logo.png"]);
  });

  it("getStoredFile retrieves the stored copy path", () => {
    const dir = makeTmpDir();
    const history = new VersionHistory(dir);

    const outDir = makeTmpDir();
    const outFile = path.join(outDir, "banner.jpg");
    fs.writeFileSync(outFile, "banner-bytes");

    const version = history.record("banner", {
      skill: "/banner-gen",
      params: { width: 1200 },
      outputFiles: [outFile],
    });

    const result = history.getStoredFile(
      "banner",
      version.hash,
      "banner.jpg",
    );
    expect(result).not.toBeNull();
    expect(fs.readFileSync(result!, "utf-8")).toBe("banner-bytes");
  });

  it("getStoredFile returns null for unknown version or filename", () => {
    const dir = makeTmpDir();
    const history = new VersionHistory(dir);

    expect(history.getStoredFile("logo", "deadbeef", "nope.png")).toBeNull();
  });
});
