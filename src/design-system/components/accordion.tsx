"use client";

import {
  useState,
  useContext,
  createContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
} from "react";

/* ─── Context ── */

interface AccordionCtx {
  openItem?: string;
  toggle: (value: string | undefined) => void;
}

const Ctx = createContext<AccordionCtx>({ toggle: () => {} });

/* ─── Accordion (single-open) ── */

interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ defaultValue, className, children, ...props }, ref) => {
    const [openItem, setOpenItem] = useState<string | undefined>(defaultValue);

    return (
      <Ctx.Provider value={{ openItem, toggle: setOpenItem }}>
        <div ref={ref} className={`divide-y divide-[var(--border)] ${className ?? ""}`} {...props}>
          {children}
        </div>
      </Ctx.Provider>
    );
  },
);

Accordion.displayName = "Accordion";

/* ─── AccordionItem ── */

interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  trigger: ReactNode;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, trigger, className, children, ...props }, ref) => {
    const { openItem, toggle } = useContext(Ctx);
    const isOpen = openItem === value;

    return (
      <div ref={ref} className={className} {...props}>
        <button
          type="button"
          onClick={() => toggle(isOpen ? undefined : value)}
          className={[
            "flex items-center justify-between w-full py-3",
            "text-[var(--text-body-sm)] font-medium text-[var(--ink)]",
            "hover:text-[var(--accent)] transition-colors",
          ].join(" ")}
          aria-expanded={isOpen}
        >
          {trigger}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          >
            <path d="M3 4.5L6 7.5L9 4.5" />
          </svg>
        </button>
        {isOpen && (
          <div className="pb-3 text-[var(--text-body-sm)] text-[var(--ink-secondary)]">
            {children}
          </div>
        )}
      </div>
    );
  },
);

AccordionItem.displayName = "AccordionItem";
