import fs from "fs";
import { parseDesignfile } from "./parser";
import { DependencyGraph } from "./graph";
import type { Designfile, BuildPlan } from "./types";

// ─── Public Types ───────────────────────────────────────────

export interface ChangeReport {
  /** Assets whose params changed compared to the previous parse. */
  modifiedAssets: string[];
  /** modifiedAssets + all transitive downstream dependents. */
  affectedAssets: string[];
  /** Ready-made build plan for the affected assets. */
  buildPlan: BuildPlan;
}

export type ChangeHandler = (changes: ChangeReport) => void;

// ─── DesignfileWatcher ──────────────────────────────────────

/**
 * Watches a designfile.yaml for changes. On each detected change
 * it re-parses the file, diffs params against the previous state,
 * and fires the `onChange` callback with a {@link ChangeReport}.
 *
 * Debounces rapid edits — waits 500 ms after the last change
 * before processing.
 *
 * Uses `fs.watch()` with an `fs.watchFile()` fallback for
 * platforms where native watchers are unreliable.
 */
export class DesignfileWatcher {
  private designfilePath: string;
  private onChange: ChangeHandler;

  /** The last successfully parsed designfile snapshot. */
  private previous: Designfile | null = null;
  /** Last change report (for status polling). */
  private lastReport: ChangeReport | null = null;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs: number;

  private fsWatcher: fs.FSWatcher | null = null;
  private usingPoll = false;

  private _active = false;

  constructor(
    designfilePath: string,
    onChange: ChangeHandler,
    debounceMs = 500,
  ) {
    this.designfilePath = designfilePath;
    this.onChange = onChange;
    this.debounceMs = debounceMs;
  }

  /** Whether the watcher is currently active. */
  get active(): boolean {
    return this._active;
  }

  /** The most recent change report, or null if nothing changed yet. */
  get latestReport(): ChangeReport | null {
    return this.lastReport;
  }

  // ─── Lifecycle ─────────────────────────────────────────────

  start(): void {
    if (this._active) return;

    // Snapshot current state
    this.previous = parseDesignfile(this.designfilePath);
    this._active = true;

    try {
      this.fsWatcher = fs.watch(this.designfilePath, () =>
        this.scheduleProcess(),
      );
      this.fsWatcher.on("error", () => this.fallbackToPoll());
    } catch {
      this.fallbackToPoll();
    }
  }

  /**
   * Manually trigger change detection (bypasses debounce).
   * Useful in tests and when you want immediate processing.
   * @internal
   */
  processNow(): void {
    this.process();
  }

  stop(): void {
    if (!this._active) return;
    this._active = false;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.fsWatcher) {
      this.fsWatcher.close();
      this.fsWatcher = null;
    }

    if (this.usingPoll) {
      fs.unwatchFile(this.designfilePath);
      this.usingPoll = false;
    }
  }

  // ─── Internal ─────────────────────────────────────────────

  private fallbackToPoll(): void {
    if (this.fsWatcher) {
      this.fsWatcher.close();
      this.fsWatcher = null;
    }
    this.usingPoll = true;
    fs.watchFile(
      this.designfilePath,
      { interval: 1000 },
      () => this.scheduleProcess(),
    );
  }

  private scheduleProcess(): void {
    if (!this._active) return;

    // Reset debounce on every event
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.process(), this.debounceMs);
  }

  private process(): void {
    if (!this._active) return;

    const current = parseDesignfile(this.designfilePath);
    if (!current) return; // file deleted or invalid — ignore

    const modified = diffDesignfiles(this.previous, current);
    if (modified.length === 0) {
      // No meaningful change
      this.previous = current;
      return;
    }

    const graph = new DependencyGraph(current);
    const affected = graph.computeAffected(modified);

    const steps = affected.map((name) => {
      const config = current.assets[name];
      const isDirect = modified.includes(name);
      return {
        name,
        skill: config.skill,
        params: config.params,
        reason: isDirect
          ? "params changed in designfile"
          : `upstream dependency changed`,
      };
    });

    const summary =
      steps.length === 1
        ? `1 asset affected: ${steps[0].name}`
        : `${steps.length} assets affected: ${steps.map((s) => s.name).join(" -> ")}`;

    const report: ChangeReport = {
      modifiedAssets: modified,
      affectedAssets: affected,
      buildPlan: { steps, summary },
    };

    this.lastReport = report;
    this.previous = current;
    this.onChange(report);
  }
}

// ─── Helpers ────────────────────────────────────────────────

/**
 * Compare two designfile snapshots and return the names of assets
 * whose params have changed (added, removed, or modified).
 */
function diffDesignfiles(
  prev: Designfile | null,
  curr: Designfile,
): string[] {
  const changed: string[] = [];
  const prevAssets = prev?.assets ?? {};

  // Check current assets against previous
  for (const [name, config] of Object.entries(curr.assets)) {
    const prevConfig = prevAssets[name];
    if (!prevConfig) {
      // New asset
      changed.push(name);
      continue;
    }
    if (JSON.stringify(sortedParams(config.params)) !==
        JSON.stringify(sortedParams(prevConfig.params))) {
      changed.push(name);
    }
  }

  // Check for removed assets (they won't trigger rebuilds,
  // but we include them so the caller knows)
  for (const name of Object.keys(prevAssets)) {
    if (!curr.assets[name]) {
      changed.push(name);
    }
  }

  return changed;
}

function sortedParams(params: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(params).sort()) {
    result[key] = params[key];
  }
  return result;
}
