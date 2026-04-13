"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@heroui/react";
import type { AssetStatus } from "@/core/designfile/types";

// --- Types ---

interface AssetOverview {
  name: string;
  skill: string;
  description?: string;
  dependsOn: string[];
  dependents: string[];
  status: AssetStatus;
  lastBuiltAt?: string;
  lastOutputFiles?: string[];
}

interface DesignfileOverview {
  brand: string;
  description?: string;
  assets: AssetOverview[];
  buildOrder: string[];
  cycle: string | null;
}

// --- Layout constants ---

const CARD_W = 140;
const CARD_H = 44;
const GAP_X = 32;
const GAP_Y = 56;
const PAD_X = 24;
const PAD_Y = 16;

// --- Depth computation ---

function computeDepths(assets: AssetOverview[]): Map<string, number> {
  const depMap = new Map<string, string[]>();
  for (const a of assets) {
    depMap.set(a.name, a.dependsOn);
  }

  const depths = new Map<string, number>();
  const visited = new Set<string>();

  function resolve(name: string): number {
    if (depths.has(name)) return depths.get(name)!;
    if (visited.has(name)) return 0; // cycle guard
    visited.add(name);

    const deps = depMap.get(name) ?? [];
    const depth = deps.length === 0 ? 0 : Math.max(...deps.map(resolve)) + 1;
    depths.set(name, depth);
    return depth;
  }

  for (const a of assets) {
    resolve(a.name);
  }
  return depths;
}

// --- Status colors ---

const STATUS_COLOR: Record<AssetStatus, string> = {
  clean: "bg-green-400",
  dirty: "bg-yellow-400",
  "never-built": "bg-zinc-500",
};

const STATUS_LABEL: Record<AssetStatus, string> = {
  clean: "Clean",
  dirty: "Dirty",
  "never-built": "Never built",
};

// --- Component ---

export function DesignfileGraph() {
  const [data, setData] = useState<DesignfileOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/designfile");
      if (res.status === 404) {
        setError("No designfile.yaml found in this project.");
        setData(null);
      } else if (!res.ok) {
        setError(`Failed to load designfile (${res.status})`);
        setData(null);
      } else {
        const json = await res.json();
        setData(json);
        setError(null);
      }
    } catch {
      setError("Failed to connect to server.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh when tab becomes visible
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "visible") {
        fetchData();
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-3 p-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-2 h-[200px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-[13px] text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="mb-1 text-[15px] font-semibold text-foreground">
          {data.brand}
        </h2>
        {data.description && (
          <p className="mb-3 text-[12px] text-muted-foreground">
            {data.description}
          </p>
        )}
        {data.cycle && (
          <div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
            Cycle detected: {data.cycle}
          </div>
        )}
        <GraphSVG assets={data.assets} />
      </div>
    </div>
  );
}

// --- SVG Graph ---

function GraphSVG({ assets }: { assets: AssetOverview[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const depths = computeDepths(assets);

  // Group assets by depth row
  const rows = new Map<number, AssetOverview[]>();
  for (const a of assets) {
    const d = depths.get(a.name) ?? 0;
    if (!rows.has(d)) rows.set(d, []);
    rows.get(d)!.push(a);
  }

  const maxDepth = Math.max(0, ...rows.keys());

  // Compute card positions: { name -> { x, y } }
  const positions = new Map<string, { x: number; y: number }>();
  let maxRowWidth = 0;

  for (let d = 0; d <= maxDepth; d++) {
    const rowAssets = rows.get(d) ?? [];
    const rowWidth = rowAssets.length * CARD_W + (rowAssets.length - 1) * GAP_X;
    if (rowWidth > maxRowWidth) maxRowWidth = rowWidth;
  }

  for (let d = 0; d <= maxDepth; d++) {
    const rowAssets = rows.get(d) ?? [];
    const rowWidth = rowAssets.length * CARD_W + (rowAssets.length - 1) * GAP_X;
    const startX = PAD_X + (maxRowWidth - rowWidth) / 2;
    const y = PAD_Y + d * (CARD_H + GAP_Y);

    for (let i = 0; i < rowAssets.length; i++) {
      const x = startX + i * (CARD_W + GAP_X);
      positions.set(rowAssets[i].name, { x, y });
    }
  }

  const svgWidth = maxRowWidth + PAD_X * 2;
  const svgHeight = PAD_Y * 2 + (maxDepth + 1) * CARD_H + maxDepth * GAP_Y;

  // Build edges
  const edges: { from: string; to: string }[] = [];
  for (const a of assets) {
    for (const dep of a.dependsOn) {
      if (positions.has(dep)) {
        edges.push({ from: dep, to: a.name });
      }
    }
  }

  if (assets.length === 0) {
    return (
      <div className="text-[13px] text-muted-foreground">
        No assets defined.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="block"
      >
        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <path d="M 0 0 L 8 3 L 0 6 Z" className="fill-border" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map(({ from, to }) => {
          const fp = positions.get(from)!;
          const tp = positions.get(to)!;
          const x1 = fp.x + CARD_W / 2;
          const y1 = fp.y + CARD_H;
          const x2 = tp.x + CARD_W / 2;
          const y2 = tp.y;
          const midY = (y1 + y2) / 2;

          return (
            <path
              key={`${from}->${to}`}
              d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
              fill="none"
              className="stroke-border"
              strokeWidth={1.5}
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Asset cards */}
        {assets.map((asset) => {
          const pos = positions.get(asset.name);
          if (!pos) return null;

          return (
            <AssetCard
              key={asset.name}
              asset={asset}
              x={pos.x}
              y={pos.y}
            />
          );
        })}
      </svg>
    </div>
  );
}

// --- Asset Card (SVG foreignObject) ---

function AssetCard({
  asset,
  x,
  y,
}: {
  asset: AssetOverview;
  x: number;
  y: number;
}) {
  return (
    <foreignObject x={x} y={y} width={CARD_W} height={CARD_H}>
      <button
        type="button"
        className={cn(
          "flex h-full w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2",
          "transition-colors hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring",
        )}
        title={`${asset.name} (${asset.skill}) — ${STATUS_LABEL[asset.status]}`}
      >
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            STATUS_COLOR[asset.status],
          )}
          aria-hidden="true"
        />
        <span className="truncate text-[12px] text-foreground">
          {asset.name}
        </span>
      </button>
    </foreignObject>
  );
}
