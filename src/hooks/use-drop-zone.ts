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

    // OS drag ended normally
    window.addEventListener("dragend", bail);
    // User alt-tabbed away — no more drag events will arrive
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
