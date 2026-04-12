import { z } from "zod";

// ─── Designfile Schema ───────────────────────────────────────

export const AssetConfigSchema = z.object({
  skill: z.string().describe("Slash command to invoke, e.g. /logo-design"),
  params: z.record(z.unknown()).default({}),
  depends_on: z.array(z.string()).default([]),
  description: z.string().optional(),
});

export const DesignfileSchema = z.object({
  brand: z.string(),
  description: z.string().optional(),
  assets: z.record(AssetConfigSchema),
});

export type AssetConfig = z.infer<typeof AssetConfigSchema>;
export type Designfile = z.infer<typeof DesignfileSchema>;

// ─── Asset State ─────────────────────────────────────────────

export type AssetStatus = "clean" | "dirty" | "never-built";

export interface StoredFile {
  /** Original path of the output file at build time. */
  originalPath: string;
  /** SHA-256 content hash (first 12 hex chars). */
  contentHash: string;
  /** Path to the stored copy inside .visagent/.history/objects/. */
  storedPath: string;
}

export interface AssetVersion {
  /** Deterministic hash of (skill + sorted params JSON). */
  hash: string;
  /** ISO timestamp of this build. */
  timestamp: string;
  /** Skill slash command used. */
  skill: string;
  /** Parameters passed to the skill. */
  params: Record<string, unknown>;
  /** Shell command that was actually executed (if available). */
  command?: string;
  /** Paths of output files produced by this build. */
  outputFiles: string[];
  /** Content-addressable copies of output files (if stored). */
  storedFiles?: StoredFile[];
}

export interface AssetState {
  /** Current version hash (matches the latest AssetVersion.hash). */
  currentHash?: string;
  /** When the asset was last built. */
  lastBuiltAt?: string;
  /** Params used in the last build. */
  lastParams?: Record<string, unknown>;
  /** Output files from the last build. */
  lastOutputFiles?: string[];
}

/** Persisted state for all assets — stored in .visagent/.state.json */
export type DesignfileState = Record<string, AssetState>;

// ─── Build Plan ──────────────────────────────────────────────

export interface BuildStep {
  /** Asset name (key in designfile.yaml). */
  name: string;
  /** Skill to invoke. */
  skill: string;
  /** Parameters for the skill. */
  params: Record<string, unknown>;
  /** Why this asset needs rebuilding. */
  reason: string;
}

export interface BuildPlan {
  /** Ordered list of assets to rebuild (topologically sorted). */
  steps: BuildStep[];
  /** Human-readable summary. */
  summary: string;
}

// ─── Graph ───────────────────────────────────────────────────

export interface DependencyInfo {
  /** Direct upstream dependencies (what this asset depends on). */
  upstream: string[];
  /** Direct downstream dependents (what depends on this asset). */
  downstream: string[];
}
