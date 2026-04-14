import path from "path";
import type { Designfile, AssetStatus, AssetVersion, BuildPlan, BuildStep } from "./types";
import { parseDesignfile } from "./parser";
import { DependencyGraph } from "./graph";
import { StateTracker } from "./state";
import { VersionHistory } from "./history";

/**
 * The Designfile engine — the single entry point for all designfile
 * operations. Composes the parser, graph, state tracker, and version
 * history into a cohesive API.
 *
 * Usage:
 *   const engine = new DesignfileEngine(cwd);
 *   if (!engine.isLoaded) return;  // no designfile.yaml in project
 *   const plan = engine.computeBuildPlan("logo");
 *   // Agent executes the plan step by step...
 *   engine.markBuilt("logo", params, outputFiles, command);
 */
export class DesignfileEngine {
  private designfile: Designfile | null = null;
  private graph: DependencyGraph | null = null;
  private state: StateTracker;
  private history: VersionHistory;
  private cwd: string;

  constructor(cwd: string) {
    this.cwd = cwd;
    const designfilePath = path.join(cwd, ".visagent", "designfile.yaml");
    const statePath = path.join(cwd, ".visagent", ".state.json");
    const historyDir = path.join(cwd, ".visagent", ".history");

    this.state = new StateTracker(statePath);
    this.history = new VersionHistory(historyDir);

    const df = parseDesignfile(designfilePath);
    if (df) {
      this.designfile = df;
      this.graph = new DependencyGraph(df);
    }
  }

  /** Whether a valid designfile was found and loaded. */
  get isLoaded(): boolean {
    return this.designfile !== null;
  }

  /** The brand name from the designfile. */
  get brand(): string | null {
    return this.designfile?.brand ?? null;
  }

  /** Cycle error if the dependency graph has a cycle. */
  get cycleError(): string | null {
    return this.graph?.cycle ?? null;
  }

  // ─── Read Operations ─────────────────────────────────────

  /**
   * Get a structured overview of the entire designfile — all assets,
   * their dependencies, and current build status.
   */
  getOverview(): {
    brand: string;
    description?: string;
    assets: Array<{
      name: string;
      skill: string;
      description?: string;
      params: Record<string, unknown>;
      dependsOn: string[];
      dependents: string[];
      status: AssetStatus;
      lastBuiltAt?: string;
      lastOutputFiles?: string[];
    }>;
    buildOrder: string[];
    cycle: string | null;
  } | null {
    if (!this.designfile || !this.graph) return null;

    const assets = [];
    for (const [name, config] of Object.entries(this.designfile.assets)) {
      const info = this.graph.getInfo(name);
      const assetState = this.state.getAssetState(name);
      assets.push({
        name,
        skill: config.skill,
        description: config.description,
        params: config.params,
        dependsOn: info?.upstream ?? [],
        dependents: info?.downstream ?? [],
        status: this.state.getStatus(name, this.designfile, this.graph),
        lastBuiltAt: assetState?.lastBuiltAt,
        lastOutputFiles: assetState?.lastOutputFiles,
      });
    }

    return {
      brand: this.designfile.brand,
      description: this.designfile.description,
      assets,
      buildOrder: this.graph.order,
      cycle: this.graph.cycle,
    };
  }

  /**
   * Get the build status of all assets.
   */
  getStatuses(): Record<string, AssetStatus> {
    if (!this.designfile || !this.graph) return {};
    return this.state.getAllStatuses(this.designfile, this.graph);
  }

  // ─── Build Planning ───────────────────────────────────────

  /**
   * Compute a build plan for rebuilding a specific asset and all
   * its downstream dependents. Only includes assets that are
   * actually dirty (or never built).
   *
   * If `force` is true, the target asset is treated as dirty even
   * if its status is clean (useful for "rebuild from scratch").
   */
  computeBuildPlan(assetName: string, force = false): BuildPlan | null {
    if (!this.designfile || !this.graph) return null;

    const assetConfig = this.designfile.assets[assetName];
    if (!assetConfig) {
      return {
        steps: [],
        summary: `Asset "${assetName}" not found in designfile.`,
      };
    }

    if (this.graph.cycle) {
      return {
        steps: [],
        summary: `Cannot compute build plan: ${this.graph.cycle}`,
      };
    }

    // Force-invalidate if requested
    if (force) {
      this.state.invalidate(assetName);
    }

    // Get all affected assets (target + downstream)
    const affected = this.graph.computeAffected([assetName]);

    // Filter to only dirty ones
    const steps: BuildStep[] = [];
    for (const name of affected) {
      const status = this.state.getStatus(name, this.designfile, this.graph);
      if (status === "clean" && !force) continue;

      const config = this.designfile.assets[name];
      if (!config) continue;

      const isDirect = name === assetName;
      steps.push({
        name,
        skill: config.skill,
        params: config.params,
        reason: isDirect
          ? force
            ? "force rebuild requested"
            : "directly requested"
          : `upstream dependency "${this.findDirtyUpstream(name, affected)}" changed`,
      });
    }

    if (steps.length === 0) {
      return {
        steps: [],
        summary: `All assets are up to date. Nothing to rebuild.`,
      };
    }

    const summary =
      steps.length === 1
        ? `Rebuild 1 asset: ${steps[0].name}`
        : `Rebuild ${steps.length} assets in order: ${steps.map((s) => s.name).join(" → ")}`;

    return { steps, summary };
  }

  // ─── State Mutations ──────────────────────────────────────

  /**
   * Mark an asset as successfully built. Updates state + records
   * a version in history.
   */
  markBuilt(
    assetName: string,
    params: Record<string, unknown>,
    outputFiles: string[],
    command?: string,
  ): AssetVersion {
    const version = this.history.record(assetName, {
      skill: this.designfile?.assets[assetName]?.skill ?? "unknown",
      params,
      command,
      outputFiles,
    });

    this.state.markBuilt(assetName, params, version.hash, outputFiles);
    return version;
  }

  /**
   * Force-invalidate an asset (mark it dirty even if params match).
   */
  invalidate(assetName: string): void {
    this.state.invalidate(assetName);
  }

  // ─── Version History ──────────────────────────────────────

  /**
   * List all recorded versions of an asset, newest first.
   */
  listVersions(assetName: string): AssetVersion[] {
    return this.history.listVersions(assetName);
  }

  /**
   * Get a specific version by hash.
   */
  getVersion(assetName: string, hash: string): AssetVersion | null {
    return this.history.getVersion(assetName, hash);
  }

  /**
   * Get the absolute path to a stored copy of an output file from a
   * specific version. Returns null if not found.
   */
  getStoredFile(assetName: string, versionHash: string, filename: string): string | null {
    return this.history.getStoredFile(assetName, versionHash, filename);
  }

  /**
   * Diff params between two versions of the same asset.
   */
  diffVersions(
    assetName: string,
    hashA: string,
    hashB: string,
  ): {
    added: Record<string, unknown>;
    removed: Record<string, unknown>;
    changed: Record<string, { from: unknown; to: unknown }>;
  } | null {
    const a = this.history.getVersion(assetName, hashA);
    const b = this.history.getVersion(assetName, hashB);
    if (!a || !b) return null;
    return this.history.diffParams(a, b);
  }

  // ─── Helpers ──────────────────────────────────────────────

  private findDirtyUpstream(name: string, affected: string[]): string {
    const info = this.graph?.getInfo(name);
    if (!info) return "unknown";
    for (const up of info.upstream) {
      if (affected.includes(up)) return up;
    }
    return info.upstream[0] ?? "unknown";
  }
}
