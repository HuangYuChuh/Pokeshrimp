"use client";

import { type HTMLAttributes } from "react";

/* ─── Skeleton ── */

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-[var(--radius-md)] bg-[var(--border-subtle)] ${className ?? ""}`}
      {...props}
    />
  );
}
