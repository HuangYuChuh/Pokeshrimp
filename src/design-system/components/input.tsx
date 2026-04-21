"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

/* ─── Shared styles ── */

const baseInput = [
  "w-full bg-[var(--surface)] text-[var(--ink)]",
  "border border-[var(--border)] rounded-[var(--radius-md)]",
  "px-3 py-2 text-[var(--text-body)]",
  "placeholder:text-[var(--ink-ghost)]",
  "transition-colors",
  "hover:border-[var(--border-strong)]",
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] focus-visible:border-transparent",
  "disabled:opacity-50 disabled:pointer-events-none",
].join(" ");

/* ─── Input ── */

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={`${baseInput} h-9 ${className ?? ""}`} {...props} />
));

Input.displayName = "Input";

/* ─── Textarea ── */

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`${baseInput} min-h-[80px] resize-y ${className ?? ""}`}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
