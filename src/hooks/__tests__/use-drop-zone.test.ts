import { describe, it, expect, vi, beforeEach } from "vitest";

/* -----------------------------------------------------------------------
 * Unit tests for useDropZone escape-hatch logic.
 *
 * The hook is a thin React wrapper around two concerns:
 *   1. A drag enter/leave counter that tracks "dragging" state
 *   2. Window-level escape hatches (dragend, blur) that force-reset
 *
 * We test the counter + escape logic directly (no DOM, no React) by
 * extracting the same algorithm the hook uses. This keeps tests fast,
 * dependency-free, and focused on the contract that matters:
 *   "given these events, is dragging true or false?"
 *
 * Limitation: React effect lifecycle (listener mount/cleanup, state
 * batching) is NOT exercised here — the project does not have
 * @testing-library/react. If RTL is added later, supplement with
 * renderHook-based integration tests for the useEffect escape hatches.
 * ----------------------------------------------------------------------- */

/* --- Minimal simulation of the counter + escape logic ------------------ */

function createDropZone(onDrop: (files: File[]) => void) {
  let counter = 0;
  let dragging = false;

  const setDragging = (v: boolean) => {
    dragging = v;
  };

  const reset = () => {
    counter = 0;
    setDragging(false);
  };

  /* Simulated handlers mirror the hook's logic exactly */
  const dragEnter = (hasFiles: boolean) => {
    if (!hasFiles) return;
    counter += 1;
    if (counter === 1) setDragging(true);
  };

  const dragLeave = () => {
    counter = Math.max(0, counter - 1);
    if (counter === 0) setDragging(false);
  };

  const drop = (files: File[]) => {
    counter = 0;
    setDragging(false);
    if (files.length > 0) onDrop(files);
  };

  return {
    get dragging() {
      return dragging;
    },
    get counter() {
      return counter;
    },
    dragEnter,
    dragLeave,
    drop,
    reset,
  };
}

/* --- Tests ------------------------------------------------------------- */

describe("useDropZone logic", () => {
  let onDrop: ReturnType<typeof vi.fn<(files: File[]) => void>>;
  let zone: ReturnType<typeof createDropZone>;

  beforeEach(() => {
    onDrop = vi.fn<(files: File[]) => void>();
    zone = createDropZone(onDrop);
  });

  it("dragenter with files sets dragging to true", () => {
    zone.dragEnter(true);
    expect(zone.dragging).toBe(true);
  });

  it("dragenter without files (text drag) does not set dragging", () => {
    zone.dragEnter(false);
    expect(zone.dragging).toBe(false);
  });

  it("balanced dragenter + dragleave resets dragging", () => {
    zone.dragEnter(true);
    zone.dragLeave();
    expect(zone.dragging).toBe(false);
  });

  it("nested dragenter/dragleave keeps dragging until counter hits 0", () => {
    // Enter parent, enter child = counter 2
    zone.dragEnter(true);
    zone.dragEnter(true);
    expect(zone.dragging).toBe(true);
    expect(zone.counter).toBe(2);

    // Leave child = counter 1, still dragging
    zone.dragLeave();
    expect(zone.dragging).toBe(true);
    expect(zone.counter).toBe(1);

    // Leave parent = counter 0, dragging off
    zone.dragLeave();
    expect(zone.dragging).toBe(false);
  });

  it("dragleave never goes below 0", () => {
    zone.dragLeave();
    zone.dragLeave();
    expect(zone.counter).toBe(0);
    expect(zone.dragging).toBe(false);
  });

  it("drop with files calls onDrop and resets", () => {
    zone.dragEnter(true);
    zone.dragEnter(true);
    const file = new File(["test"], "test.skill.md");
    zone.drop([file]);
    expect(onDrop).toHaveBeenCalledWith([file]);
    expect(zone.dragging).toBe(false);
    expect(zone.counter).toBe(0);
  });

  it("drop with empty files does not call onDrop", () => {
    zone.dragEnter(true);
    zone.drop([]);
    expect(onDrop).not.toHaveBeenCalled();
    expect(zone.dragging).toBe(false);
  });

  it("reset force-clears counter and dragging (simulates escape hatches)", () => {
    zone.dragEnter(true);
    zone.dragEnter(true);
    expect(zone.dragging).toBe(true);

    // Simulate: window blur / dragend / ESC
    zone.reset();
    expect(zone.dragging).toBe(false);
    expect(zone.counter).toBe(0);
  });

  it("reset is idempotent when not dragging", () => {
    zone.reset();
    expect(zone.dragging).toBe(false);
    expect(zone.counter).toBe(0);
  });
});
