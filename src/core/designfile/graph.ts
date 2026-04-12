import type { Designfile, DependencyInfo } from "./types";

/**
 * Dependency graph built from a Designfile. Provides topological
 * ordering, upstream/downstream queries, and cycle detection.
 *
 * The graph is immutable after construction — rebuild it if the
 * designfile changes.
 */
export class DependencyGraph {
  /** asset name → its direct upstream deps */
  private upstream = new Map<string, string[]>();
  /** asset name → its direct downstream dependents */
  private downstream = new Map<string, string[]>();
  /** All asset names in topological order (upstream first). */
  private topoOrder: string[];
  /** Non-null if the graph contains a cycle. */
  private cycleError: string | null;

  constructor(designfile: Designfile) {
    const assetNames = Object.keys(designfile.assets);

    // Initialize adjacency lists
    for (const name of assetNames) {
      this.upstream.set(name, []);
      this.downstream.set(name, []);
    }

    // Build edges
    for (const [name, config] of Object.entries(designfile.assets)) {
      const deps = config.depends_on.filter((d) => assetNames.includes(d));
      this.upstream.set(name, deps);
      for (const dep of deps) {
        this.downstream.get(dep)!.push(name);
      }
    }

    // Topological sort (Kahn's algorithm) + cycle detection
    const { order, hasCycle } = kahnSort(assetNames, this.upstream);
    this.topoOrder = order;
    this.cycleError = hasCycle
      ? `Dependency cycle detected among: ${assetNames.filter((n) => !order.includes(n)).join(", ")}`
      : null;
  }

  /** All asset names in topological order (upstream-first). */
  get order(): string[] {
    return this.topoOrder;
  }

  /** Returns cycle description if a cycle exists, null otherwise. */
  get cycle(): string | null {
    return this.cycleError;
  }

  /** Get dependency info for a single asset. */
  getInfo(name: string): DependencyInfo | null {
    if (!this.upstream.has(name)) return null;
    return {
      upstream: this.upstream.get(name) ?? [],
      downstream: this.downstream.get(name) ?? [],
    };
  }

  /**
   * Get all assets transitively downstream from `name` (exclusive).
   * Returns them in topological order.
   */
  getTransitiveDownstream(name: string): string[] {
    const visited = new Set<string>();
    const queue = [name];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const dep of this.downstream.get(current) ?? []) {
        if (!visited.has(dep)) {
          visited.add(dep);
          queue.push(dep);
        }
      }
    }
    // Return in topological order
    return this.topoOrder.filter((n) => visited.has(n));
  }

  /**
   * Get all assets transitively upstream from `name` (exclusive).
   * Returns them in reverse topological order (deepest deps first).
   */
  getTransitiveUpstream(name: string): string[] {
    const visited = new Set<string>();
    const queue = [name];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const dep of this.upstream.get(current) ?? []) {
        if (!visited.has(dep)) {
          visited.add(dep);
          queue.push(dep);
        }
      }
    }
    return this.topoOrder.filter((n) => visited.has(n));
  }

  /**
   * Given a set of "dirty" asset names, compute the full set that
   * needs rebuilding (including all downstream dependents), returned
   * in topological order.
   */
  computeAffected(dirtyNames: string[]): string[] {
    const affected = new Set(dirtyNames);
    for (const name of dirtyNames) {
      for (const dep of this.getTransitiveDownstream(name)) {
        affected.add(dep);
      }
    }
    return this.topoOrder.filter((n) => affected.has(n));
  }
}

// ─── Kahn's Topological Sort ─────────────────────────────────

function kahnSort(
  nodes: string[],
  upstream: Map<string, string[]>,
): { order: string[]; hasCycle: boolean } {
  const inDegree = new Map<string, number>();
  for (const n of nodes) inDegree.set(n, 0);

  for (const [, deps] of upstream) {
    for (const dep of deps) {
      // dep → node edge: node depends on dep
      // But we need downstream edges for in-degree.
      // Actually: in the DAG, an edge from A→B means "B depends on A".
      // In-degree of B = number of deps of B.
    }
  }

  // In-degree = number of direct upstream dependencies
  for (const [node, deps] of upstream) {
    inDegree.set(node, deps.length);
  }

  const queue: string[] = [];
  for (const [node, deg] of inDegree) {
    if (deg === 0) queue.push(node);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node);
    // For each node that depends on `node` (downstream), reduce in-degree
    for (const [candidate, deps] of upstream) {
      if (deps.includes(node)) {
        const newDeg = (inDegree.get(candidate) ?? 1) - 1;
        inDegree.set(candidate, newDeg);
        if (newDeg === 0) queue.push(candidate);
      }
    }
  }

  return { order, hasCycle: order.length < nodes.length };
}
