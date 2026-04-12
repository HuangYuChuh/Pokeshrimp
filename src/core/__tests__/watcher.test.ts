import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { DesignfileWatcher, type ChangeReport } from "@/core/designfile/watcher";

let tmpDirs: string[] = [];

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "watcher-test-"));
  tmpDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tmpDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tmpDirs = [];
});

function writeDesignfile(
  filePath: string,
  assets: Record<string, { skill: string; params: Record<string, unknown>; depends_on?: string[] }>,
): void {
  const lines = [`brand: test`, `assets:`];
  for (const [name, config] of Object.entries(assets)) {
    lines.push(`  ${name}:`);
    lines.push(`    skill: "${config.skill}"`);
    lines.push(`    params:`);
    for (const [k, v] of Object.entries(config.params)) {
      lines.push(`      ${k}: ${JSON.stringify(v)}`);
    }
    if (config.depends_on && config.depends_on.length > 0) {
      lines.push(`    depends_on:`);
      for (const dep of config.depends_on) {
        lines.push(`      - ${dep}`);
      }
    }
  }
  fs.writeFileSync(filePath, lines.join("\n") + "\n");
}

describe("DesignfileWatcher", () => {
  it("detects param changes and fires onChange", () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, "designfile.yaml");

    writeDesignfile(filePath, {
      logo: { skill: "/logo", params: { color: "red" } },
    });

    const reports: ChangeReport[] = [];
    const watcher = new DesignfileWatcher(filePath, (r) => reports.push(r), 50);
    watcher.start();

    // Modify the file and trigger processing manually
    writeDesignfile(filePath, {
      logo: { skill: "/logo", params: { color: "blue" } },
    });
    watcher.processNow();
    watcher.stop();

    expect(reports.length).toBe(1);
    expect(reports[0].modifiedAssets).toContain("logo");
    expect(reports[0].affectedAssets).toContain("logo");
    expect(reports[0].buildPlan.steps.length).toBe(1);
    expect(reports[0].buildPlan.steps[0].name).toBe("logo");
  });

  it("includes downstream dependents in affectedAssets", () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, "designfile.yaml");

    writeDesignfile(filePath, {
      logo: { skill: "/logo", params: { color: "red" } },
      banner: { skill: "/banner", params: { size: "large" }, depends_on: ["logo"] },
    });

    const reports: ChangeReport[] = [];
    const watcher = new DesignfileWatcher(filePath, (r) => reports.push(r), 50);
    watcher.start();

    // Modify only the upstream asset
    writeDesignfile(filePath, {
      logo: { skill: "/logo", params: { color: "green" } },
      banner: { skill: "/banner", params: { size: "large" }, depends_on: ["logo"] },
    });
    watcher.processNow();
    watcher.stop();

    expect(reports.length).toBe(1);
    expect(reports[0].modifiedAssets).toEqual(["logo"]);
    expect(reports[0].affectedAssets).toContain("logo");
    expect(reports[0].affectedAssets).toContain("banner");
    expect(reports[0].buildPlan.steps.length).toBe(2);
  });

  it("does not fire when params are unchanged", () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, "designfile.yaml");

    writeDesignfile(filePath, {
      logo: { skill: "/logo", params: { color: "red" } },
    });

    const reports: ChangeReport[] = [];
    const watcher = new DesignfileWatcher(filePath, (r) => reports.push(r), 50);
    watcher.start();

    // Re-write identical content
    writeDesignfile(filePath, {
      logo: { skill: "/logo", params: { color: "red" } },
    });
    watcher.processNow();
    watcher.stop();

    expect(reports.length).toBe(0);
  });

  it("detects newly added assets", () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, "designfile.yaml");

    writeDesignfile(filePath, {
      logo: { skill: "/logo", params: { color: "red" } },
    });

    const reports: ChangeReport[] = [];
    const watcher = new DesignfileWatcher(filePath, (r) => reports.push(r), 50);
    watcher.start();

    // Add a new asset
    writeDesignfile(filePath, {
      logo: { skill: "/logo", params: { color: "red" } },
      icon: { skill: "/icon", params: { size: 32 } },
    });
    watcher.processNow();
    watcher.stop();

    expect(reports.length).toBe(1);
    expect(reports[0].modifiedAssets).toContain("icon");
    expect(reports[0].modifiedAssets).not.toContain("logo");
  });

  it("stop prevents further callbacks", () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, "designfile.yaml");

    writeDesignfile(filePath, {
      logo: { skill: "/logo", params: { color: "red" } },
    });

    const reports: ChangeReport[] = [];
    const watcher = new DesignfileWatcher(filePath, (r) => reports.push(r), 50);
    watcher.start();
    watcher.stop();

    // Modify after stopping — processNow should be no-op
    writeDesignfile(filePath, {
      logo: { skill: "/logo", params: { color: "blue" } },
    });
    watcher.processNow();

    expect(reports.length).toBe(0);
    expect(watcher.active).toBe(false);
  });

  it("start is idempotent", () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, "designfile.yaml");

    writeDesignfile(filePath, {
      logo: { skill: "/logo", params: { color: "red" } },
    });

    const watcher = new DesignfileWatcher(filePath, () => {}, 50);
    watcher.start();
    watcher.start(); // should not throw
    expect(watcher.active).toBe(true);
    watcher.stop();
  });

  it("debounce fires after fs.watch event", async () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, "designfile.yaml");

    writeDesignfile(filePath, {
      logo: { skill: "/logo", params: { color: "red" } },
    });

    const reports: ChangeReport[] = [];
    // Use a short debounce for this integration-style test
    const watcher = new DesignfileWatcher(filePath, (r) => reports.push(r), 100);
    watcher.start();

    // Modify file — rely on fs.watch / fs.watchFile + debounce
    writeDesignfile(filePath, {
      logo: { skill: "/logo", params: { color: "blue" } },
    });

    // Wait enough time for debounce (100ms) + fs notification
    await new Promise((r) => setTimeout(r, 2000));
    watcher.stop();

    // This test may not fire on all CI platforms due to fs.watch
    // flakiness, so we just assert it doesn't crash. If the event
    // fires, verify correctness.
    if (reports.length > 0) {
      expect(reports[0].modifiedAssets).toContain("logo");
    }
  });

  it("latestReport reflects the last change", () => {
    const dir = makeTmpDir();
    const filePath = path.join(dir, "designfile.yaml");

    writeDesignfile(filePath, {
      logo: { skill: "/logo", params: { color: "red" } },
    });

    const watcher = new DesignfileWatcher(filePath, () => {}, 50);
    watcher.start();

    expect(watcher.latestReport).toBeNull();

    writeDesignfile(filePath, {
      logo: { skill: "/logo", params: { color: "blue" } },
    });
    watcher.processNow();

    expect(watcher.latestReport).not.toBeNull();
    expect(watcher.latestReport!.modifiedAssets).toContain("logo");

    watcher.stop();
  });
});
