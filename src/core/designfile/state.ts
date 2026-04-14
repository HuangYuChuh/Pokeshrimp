import fs from "fs";
import crypto from "crypto";
import type { Designfile, AssetStatus, AssetState, DesignfileState } from "./types";
import type { DependencyGraph } from "./graph";

/**
 * Tracks the build state of each asset — whether it's clean, dirty,
 * or never been built. Persisted to `.visagent/.state.json`.
 *
 * An asset is "dirty" if:
 *   - It has never been built, OR
 *   - Its params in the designfile differ from what was last built, OR
 *   - Any of its upstream dependencies is dirty (cascade)
 */
export class StateTracker {
  private state: DesignfileState;
  private statePath: string;

  constructor(statePath: string) {
    this.statePath = statePath;
    this.state = {};
    try {
      const raw = fs.readFileSync(statePath, "utf-8");
      this.state = JSON.parse(raw) as DesignfileState;
    } catch {
      // No state file yet — everything is "never-built"
    }
  }

  /**
   * Determine the status of a single asset, considering both its own
   * params and the status of its upstream dependencies.
   */
  getStatus(assetName: string, designfile: Designfile, graph: DependencyGraph): AssetStatus {
    const assetConfig = designfile.assets[assetName];
    if (!assetConfig) return "never-built";

    const assetState = this.state[assetName];
    if (!assetState || !assetState.currentHash) return "never-built";

    // Check if params changed since last build
    const currentParamsHash = hashParams(assetConfig.params);
    const lastParamsHash = assetState.lastParams ? hashParams(assetState.lastParams) : null;

    if (currentParamsHash !== lastParamsHash) return "dirty";

    // Check if any upstream dependency is dirty (cascade)
    const info = graph.getInfo(assetName);
    if (info) {
      for (const upstreamName of info.upstream) {
        const upStatus = this.getStatus(upstreamName, designfile, graph);
        if (upStatus !== "clean") return "dirty";
      }
    }

    return "clean";
  }

  /**
   * Get all asset statuses at once.
   */
  getAllStatuses(designfile: Designfile, graph: DependencyGraph): Record<string, AssetStatus> {
    const result: Record<string, AssetStatus> = {};
    for (const name of Object.keys(designfile.assets)) {
      result[name] = this.getStatus(name, designfile, graph);
    }
    return result;
  }

  /**
   * Get the raw state for an asset (last build info).
   */
  getAssetState(name: string): AssetState | null {
    return this.state[name] ?? null;
  }

  /**
   * Mark an asset as successfully built. Updates the state and
   * persists to disk.
   */
  markBuilt(
    assetName: string,
    params: Record<string, unknown>,
    hash: string,
    outputFiles: string[],
  ): void {
    this.state[assetName] = {
      currentHash: hash,
      lastBuiltAt: new Date().toISOString(),
      lastParams: params,
      lastOutputFiles: outputFiles,
    };
    this.persist();
  }

  /**
   * Force-mark an asset as dirty (e.g. when user explicitly requests
   * a rebuild even if params haven't changed).
   */
  invalidate(assetName: string): void {
    const current = this.state[assetName];
    if (current) {
      current.currentHash = undefined;
      this.persist();
    }
  }

  private persist(): void {
    try {
      const dir = this.statePath.replace(/[/\\][^/\\]+$/, "");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2) + "\n");
    } catch {
      // Best-effort persistence
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function hashParams(params: Record<string, unknown>): string {
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(params).sort()) {
    sorted[key] = params[key];
  }
  return crypto.createHash("sha256").update(JSON.stringify(sorted)).digest("hex").slice(0, 12);
}
