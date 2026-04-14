import { describe, it, expect } from "vitest";
import { DependencyGraph } from "@/core/designfile/graph";
import type { Designfile } from "@/core/designfile/types";

function makeDesignfile(assets: Record<string, { depends_on?: string[] }>): Designfile {
  const result: Designfile = { brand: "test", assets: {} };
  for (const [name, cfg] of Object.entries(assets)) {
    result.assets[name] = {
      skill: "/test",
      params: {},
      depends_on: cfg.depends_on ?? [],
    };
  }
  return result;
}

describe("DependencyGraph", () => {
  it("topological sort places upstream before downstream", () => {
    const df = makeDesignfile({
      A: {},
      B: { depends_on: ["A"] },
      C: { depends_on: ["B"] },
    });
    const graph = new DependencyGraph(df);
    const order = graph.order;
    expect(order.indexOf("A")).toBeLessThan(order.indexOf("B"));
    expect(order.indexOf("B")).toBeLessThan(order.indexOf("C"));
  });

  it("detects cycles", () => {
    const df = makeDesignfile({
      A: { depends_on: ["B"] },
      B: { depends_on: ["A"] },
    });
    const graph = new DependencyGraph(df);
    expect(graph.cycle).not.toBeNull();
    expect(graph.cycle).toContain("cycle");
  });

  it("returns null cycle for acyclic graph", () => {
    const df = makeDesignfile({ A: {}, B: { depends_on: ["A"] } });
    const graph = new DependencyGraph(df);
    expect(graph.cycle).toBeNull();
  });

  it("single node with no deps", () => {
    const df = makeDesignfile({ solo: {} });
    const graph = new DependencyGraph(df);
    expect(graph.order).toEqual(["solo"]);
    expect(graph.cycle).toBeNull();
    expect(graph.getInfo("solo")).toEqual({ upstream: [], downstream: [] });
  });

  it("linear chain A → B → C", () => {
    const df = makeDesignfile({
      A: {},
      B: { depends_on: ["A"] },
      C: { depends_on: ["B"] },
    });
    const graph = new DependencyGraph(df);
    expect(graph.order).toEqual(["A", "B", "C"]);
  });

  it("diamond dependency A → B,C → D", () => {
    const df = makeDesignfile({
      A: {},
      B: { depends_on: ["A"] },
      C: { depends_on: ["A"] },
      D: { depends_on: ["B", "C"] },
    });
    const graph = new DependencyGraph(df);
    const order = graph.order;
    expect(order.indexOf("A")).toBeLessThan(order.indexOf("B"));
    expect(order.indexOf("A")).toBeLessThan(order.indexOf("C"));
    expect(order.indexOf("B")).toBeLessThan(order.indexOf("D"));
    expect(order.indexOf("C")).toBeLessThan(order.indexOf("D"));
  });

  it("getTransitiveDownstream returns all downstream in topo order", () => {
    const df = makeDesignfile({
      A: {},
      B: { depends_on: ["A"] },
      C: { depends_on: ["B"] },
      D: { depends_on: ["A"] },
    });
    const graph = new DependencyGraph(df);
    const downstream = graph.getTransitiveDownstream("A");
    expect(downstream).toContain("B");
    expect(downstream).toContain("C");
    expect(downstream).toContain("D");
    expect(downstream).not.toContain("A");
  });

  it("getTransitiveUpstream returns all upstream in topo order", () => {
    const df = makeDesignfile({
      A: {},
      B: { depends_on: ["A"] },
      C: { depends_on: ["B"] },
    });
    const graph = new DependencyGraph(df);
    const upstream = graph.getTransitiveUpstream("C");
    expect(upstream).toContain("A");
    expect(upstream).toContain("B");
    expect(upstream).not.toContain("C");
  });

  it("computeAffected includes dirty nodes and all downstream", () => {
    const df = makeDesignfile({
      A: {},
      B: { depends_on: ["A"] },
      C: { depends_on: ["B"] },
      D: {},
    });
    const graph = new DependencyGraph(df);
    const affected = graph.computeAffected(["A"]);
    expect(affected).toContain("A");
    expect(affected).toContain("B");
    expect(affected).toContain("C");
    expect(affected).not.toContain("D");
  });

  it("computeAffected returns in topological order", () => {
    const df = makeDesignfile({
      A: {},
      B: { depends_on: ["A"] },
      C: { depends_on: ["B"] },
    });
    const graph = new DependencyGraph(df);
    const affected = graph.computeAffected(["A"]);
    expect(affected).toEqual(["A", "B", "C"]);
  });

  it("getInfo returns null for unknown asset", () => {
    const df = makeDesignfile({ A: {} });
    const graph = new DependencyGraph(df);
    expect(graph.getInfo("nonexistent")).toBeNull();
  });
});
