import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { AssetVersion } from "./types";

/**
 * Content-addressable version history for design assets.
 *
 * Per docs/00 §3.5 "内容寻址的版本管理（Git 哲学）":
 * each build stores its full context (skill, params, command, output
 * file paths) keyed by a deterministic hash. Any version can be
 * retrieved, params can be diffed, and a build can be forked from
 * any past version by modifying its params and re-running.
 *
 * Storage layout:
 *   .visagent/.history/<asset-name>/
 *     ├── <hash1>.json   ← AssetVersion metadata
 *     ├── <hash2>.json
 *     └── ...
 *
 * The hash is computed from (skill + sorted params JSON), so
 * identical configurations always produce the same hash. Output
 * files are referenced by path, not copied — the important thing
 * is the "source code" (params), not the binary output.
 */
export class VersionHistory {
  private baseDir: string;

  constructor(historyDir: string) {
    this.baseDir = historyDir;
  }

  /**
   * Record a completed build as a new version.
   * Returns the version object (including its computed hash).
   */
  record(
    assetName: string,
    build: {
      skill: string;
      params: Record<string, unknown>;
      command?: string;
      outputFiles: string[];
    },
  ): AssetVersion {
    const hash = computeHash(build.skill, build.params);
    const version: AssetVersion = {
      hash,
      timestamp: new Date().toISOString(),
      skill: build.skill,
      params: build.params,
      command: build.command,
      outputFiles: build.outputFiles,
    };

    const assetDir = path.join(this.baseDir, assetName);
    fs.mkdirSync(assetDir, { recursive: true });
    fs.writeFileSync(
      path.join(assetDir, `${hash}.json`),
      JSON.stringify(version, null, 2) + "\n",
    );

    return version;
  }

  /**
   * List all versions of an asset, sorted newest-first.
   */
  listVersions(assetName: string): AssetVersion[] {
    const assetDir = path.join(this.baseDir, assetName);
    if (!fs.existsSync(assetDir)) return [];

    const versions: AssetVersion[] = [];
    try {
      for (const file of fs.readdirSync(assetDir)) {
        if (!file.endsWith(".json")) continue;
        try {
          const raw = fs.readFileSync(path.join(assetDir, file), "utf-8");
          versions.push(JSON.parse(raw) as AssetVersion);
        } catch {
          // Corrupted entry — skip
        }
      }
    } catch {
      return [];
    }

    return versions.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  /**
   * Get a specific version by hash.
   */
  getVersion(assetName: string, hash: string): AssetVersion | null {
    const filePath = path.join(this.baseDir, assetName, `${hash}.json`);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw) as AssetVersion;
    } catch {
      return null;
    }
  }

  /**
   * Diff the params between two versions. Returns an object showing
   * which keys were added, removed, or changed.
   */
  diffParams(
    a: AssetVersion,
    b: AssetVersion,
  ): {
    added: Record<string, unknown>;
    removed: Record<string, unknown>;
    changed: Record<string, { from: unknown; to: unknown }>;
  } {
    const added: Record<string, unknown> = {};
    const removed: Record<string, unknown> = {};
    const changed: Record<string, { from: unknown; to: unknown }> = {};

    const aKeys = new Set(Object.keys(a.params));
    const bKeys = new Set(Object.keys(b.params));

    for (const key of bKeys) {
      if (!aKeys.has(key)) {
        added[key] = b.params[key];
      } else if (JSON.stringify(a.params[key]) !== JSON.stringify(b.params[key])) {
        changed[key] = { from: a.params[key], to: b.params[key] };
      }
    }

    for (const key of aKeys) {
      if (!bKeys.has(key)) {
        removed[key] = a.params[key];
      }
    }

    return { added, removed, changed };
  }
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Deterministic hash from skill + params. Same configuration always
 * produces the same hash, enabling deduplication and cache hits.
 */
function computeHash(
  skill: string,
  params: Record<string, unknown>,
): string {
  const content = JSON.stringify({ skill, params: sortKeys(params) });
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 12);
}

function sortKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = obj[key];
  }
  return sorted;
}
