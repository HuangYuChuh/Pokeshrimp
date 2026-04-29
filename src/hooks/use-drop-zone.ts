"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* -----------------------------------------------------------------------
 * useDropZone
 * Centralized drag-and-drop state with self-healing escape hatches.
 * Owns the enter/leave counter so the OS can never strand the UI.
 * ----------------------------------------------------------------------- */

interface UseDropZoneOptions {
  onDrop: (files: File[]) => void | Promise<void>;
}

interface DropHandlers {
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

interface UseDropZoneReturn {
  dragging: boolean;
  reset: () => void;
  handlers: DropHandlers;
}

export function useDropZone({ onDrop }: UseDropZoneOptions): UseDropZoneReturn {
  const [dragging, setDragging] = useState(false);
  const counter = useRef(0);

  const reset = useCallback(() => {
    counter.current = 0;
    setDragging(false);
  }, []);

  /* --- Core drag handlers ---------------------------------------------- */

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.dataTransfer.types.includes("Files")) return;
    counter.current += 1;
    if (counter.current === 1) setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    counter.current = Math.max(0, counter.current - 1);
    if (counter.current === 0) setDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      counter.current = 0;
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onDrop(files);
    },
    [onDrop],
  );

  /* --- Escape hatches (active only while dragging) --------------------- */

  useEffect(() => {
    if (!dragging) return;

    const bail = () => {
      counter.current = 0;
      setDragging(false);
    };

    // Defense-in-depth: multiple escape hatches ensure the overlay
    // can never get stuck. dragend may not fire for all OS drag
    // cancellations, but blur + ESC (in overlay) + click-to-dismiss
    // cover the remaining scenarios.
    window.addEventListener("dragend", bail);
    window.addEventListener("blur", bail);

    return () => {
      window.removeEventListener("dragend", bail);
      window.removeEventListener("blur", bail);
    };
  }, [dragging]);

  return {
    dragging,
    reset,
    handlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
}
