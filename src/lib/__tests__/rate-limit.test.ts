import { describe, it, expect, vi, afterEach } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows requests within the limit", () => {
    const limiter = rateLimit({ interval: 60_000, limit: 3 });

    const r1 = limiter("user-a");
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = limiter("user-a");
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = limiter("user-a");
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("rejects requests exceeding the limit", () => {
    const limiter = rateLimit({ interval: 60_000, limit: 2 });

    limiter("user-a");
    limiter("user-a");

    const r3 = limiter("user-a");
    expect(r3.success).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("tracks keys independently", () => {
    const limiter = rateLimit({ interval: 60_000, limit: 1 });

    const r1 = limiter("user-a");
    expect(r1.success).toBe(true);

    const r2 = limiter("user-b");
    expect(r2.success).toBe(true);

    // user-a is now exhausted
    const r3 = limiter("user-a");
    expect(r3.success).toBe(false);
  });

  it("resets the window after the interval expires", () => {
    vi.useFakeTimers();

    const limiter = rateLimit({ interval: 1_000, limit: 1 });

    const r1 = limiter("user-a");
    expect(r1.success).toBe(true);

    const r2 = limiter("user-a");
    expect(r2.success).toBe(false);

    // Advance past the 1s window
    vi.advanceTimersByTime(1_001);

    const r3 = limiter("user-a");
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);

    vi.useRealTimers();
  });

  it("returns a reset timestamp in the future", () => {
    const before = Date.now();
    const limiter = rateLimit({ interval: 60_000, limit: 5 });
    const result = limiter("user-a");

    expect(result.reset).toBeGreaterThanOrEqual(before + 60_000);
  });
});
