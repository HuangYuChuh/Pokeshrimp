import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { StateTracker } from "@/core/designfile/state";
import { DependencyGraph } from "@/core/designfile/graph";
import type { Designfile } from "@/core/designfile/types";

function makeDesignfile(
  assets: Record<string, { params?: Record<string, unknown>; depends_on?: string[] }>,
): Designfile {
  const result: Designfile = { brand: "test", assets: {} };
  for (const [name, cfg] of Object.entries(assets)) {
    result.assets[name] = {
      skill: "/test",
      params: cfg.params ?? {},
      depends_on: cfg.depends_on ?? [],
    };
  }
  return result;
}

let tmpDirs: string[] = [];

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "state-test-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tmpDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tmpDirs = [];
});

describe("StateTracker", () => {
  it("initial status is never-built for unknown assets", () => {
    const dir = makeTmpDir();
    const tracker = new StateTracker(path.join(dir, ".state.json"));
    const df = makeDesignfile({ logo: {} });
    const graph = new DependencyGraph(df);
    expect(tracker.getStatus("logo", df, graph)).toBe("never-built");
  });

  it("markBuilt changes status to clean", () => {
    const dir = makeTmpDir();
    const tracker = new StateTracker(path.join(dir, ".state.json"));
    const df = makeDesignfile({ logo: { params: { color: "red" } } });
    const graph = new DependencyGraph(df);

    tracker.markBuilt("logo", { color: "red" }, "abc123", ["/out/logo.png"]);
    expect(tracker.getStatus("logo", df, graph)).toBe("clean");
  });

  it("param change makes asset dirty", () => {
    const dir = makeTmpDir();
    const tracker = new StateTracker(path.join(dir, ".state.json"));

    // Build with old params
    const df1 = makeDesignfile({ logo: { params: { color: "red" } } });
    const _graph1 = new DependencyGraph(df1);
    tracker.markBuilt("logo", { color: "red" }, "abc123", []);

    // Now the designfile has different params
    const df2 = makeDesignfile({ logo: { params: { color: "blue" } } });
    const graph2 = new DependencyGraph(df2);
    expect(tracker.getStatus("logo", df2, graph2)).toBe("dirty");
  });

  it("upstream dirty cascades downstream", () => {
    const dir = makeTmpDir();
    const tracker = new StateTracker(path.join(dir, ".state.json"));

    const df = makeDesignfile({
      base: { params: { size: 512 } },
      derived: { params: { overlay: true }, depends_on: ["base"] },
    });
    const graph = new DependencyGraph(df);

    // Build both with current params
    tracker.markBuilt("base", { size: 512 }, "h1", []);
    tracker.markBuilt("derived", { overlay: true }, "h2", []);
    expect(tracker.getStatus("derived", df, graph)).toBe("clean");

    // Change base params in designfile
    const df2 = makeDesignfile({
      base: { params: { size: 1024 } },
      derived: { params: { overlay: true }, depends_on: ["base"] },
    });
    const graph2 = new DependencyGraph(df2);
    expect(tracker.getStatus("derived", df2, graph2)).toBe("dirty");
  });

  it("invalidate forces dirty even when params match", () => {
    const dir = makeTmpDir();
    const tracker = new StateTracker(path.join(dir, ".state.json"));
    const df = makeDesignfile({ logo: { params: { color: "red" } } });
    const graph = new DependencyGraph(df);

    tracker.markBuilt("logo", { color: "red" }, "abc123", []);
    expect(tracker.getStatus("logo", df, graph)).toBe("clean");

    tracker.invalidate("logo");
    expect(tracker.getStatus("logo", df, graph)).toBe("never-built");
  });

  it("persists state to disk and re-reads on construction", () => {
    const dir = makeTmpDir();
    const statePath = path.join(dir, ".state.json");

    const tracker1 = new StateTracker(statePath);
    tracker1.markBuilt("logo", { color: "red" }, "abc123", ["/out/logo.png"]);

    // Create a new tracker from the same file
    const tracker2 = new StateTracker(statePath);
    const df = makeDesignfile({ logo: { params: { color: "red" } } });
    const graph = new DependencyGraph(df);
    expect(tracker2.getStatus("logo", df, graph)).toBe("clean");
  });

  it("getAssetState returns null for unknown asset", () => {
    const dir = makeTmpDir();
    const tracker = new StateTracker(path.join(dir, ".state.json"));
    expect(tracker.getAssetState("nope")).toBeNull();
  });

  it("getAssetState returns build info after markBuilt", () => {
    const dir = makeTmpDir();
    const tracker = new StateTracker(path.join(dir, ".state.json"));
    tracker.markBuilt("logo", { color: "red" }, "abc123", ["/out/logo.png"]);
    const state = tracker.getAssetState("logo");
    expect(state).not.toBeNull();
    expect(state!.currentHash).toBe("abc123");
    expect(state!.lastOutputFiles).toEqual(["/out/logo.png"]);
  });

  it("getAllStatuses reports all assets", () => {
    const dir = makeTmpDir();
    const tracker = new StateTracker(path.join(dir, ".state.json"));
    const df = makeDesignfile({
      A: { params: { x: 1 } },
      B: { params: { y: 2 } },
    });
    const graph = new DependencyGraph(df);
    tracker.markBuilt("A", { x: 1 }, "h1", []);
    const statuses = tracker.getAllStatuses(df, graph);
    expect(statuses.A).toBe("clean");
    expect(statuses.B).toBe("never-built");
  });
});
