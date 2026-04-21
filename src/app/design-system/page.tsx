"use client";

import "../../design-system/index.css";

import {
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardContent,
  Modal,
  ModalTrigger,
  ModalClose,
  ModalContent,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
} from "@/design-system/components";
import { useState } from "react";

/* ─── Theme toggle ── */

function ThemeToggle() {
  const [dark, setDark] = useState(true);
  return (
    <button
      type="button"
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("light", !next);
      }}
      className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] text-[var(--text-body-sm)]"
    >
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}

/* ─── Section wrapper ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-[var(--space-12)]">
      <h2
        className="text-[var(--text-headline)] font-semibold text-[var(--ink)] mb-[var(--space-5)]"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ─── Color swatch ── */

function Swatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex items-center gap-[var(--gap-inline)]">
      <div
        className="w-10 h-10 rounded-[var(--radius-md)] border border-[var(--border)]"
        style={{ background: `var(${cssVar})` }}
      />
      <div>
        <div className="text-[var(--text-body-sm)] text-[var(--ink)]">{name}</div>
        <div className="text-[var(--text-caption)] text-[var(--ink-tertiary)] font-mono">
          {cssVar}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ── */

export default function DesignSystemPreview() {
  return (
    <TooltipProvider>
      <div
        className="min-h-screen p-[var(--space-8)]"
        style={{
          background: "var(--canvas)",
          color: "var(--ink)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <ThemeToggle />

        <h1
          className="text-[var(--text-hero)] font-light text-[var(--ink)] mb-2"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Pokeshrimp Design System
        </h1>
        <p className="text-[var(--text-body)] text-[var(--ink-secondary)] mb-[var(--space-12)]">
          Claude-inspired warm conversational UI — token preview & component gallery.
        </p>

        {/* ── Colors ── */}
        <Section title="Colors">
          <div className="grid grid-cols-3 gap-[var(--space-4)]">
            <Swatch name="Canvas" cssVar="--canvas" />
            <Swatch name="Canvas Subtle" cssVar="--canvas-subtle" />
            <Swatch name="Canvas Invert" cssVar="--canvas-invert" />
            <Swatch name="Ink" cssVar="--ink" />
            <Swatch name="Ink Secondary" cssVar="--ink-secondary" />
            <Swatch name="Ink Tertiary" cssVar="--ink-tertiary" />
            <Swatch name="Ink Ghost" cssVar="--ink-ghost" />
            <Swatch name="Accent" cssVar="--accent" />
            <Swatch name="Accent Hover" cssVar="--accent-hover" />
            <Swatch name="Success" cssVar="--success" />
            <Swatch name="Warning" cssVar="--warning" />
            <Swatch name="Error" cssVar="--error" />
            <Swatch name="Surface" cssVar="--surface" />
            <Swatch name="Surface Raised" cssVar="--surface-raised" />
            <Swatch name="Border" cssVar="--border" />
          </div>
        </Section>

        {/* ── Typography ── */}
        <Section title="Typography">
          <div className="space-y-[var(--space-3)]">
            <p
              style={{
                fontSize: "var(--text-hero)",
                fontFamily: "var(--font-serif)",
                lineHeight: "var(--leading-tight)",
              }}
            >
              Hero — What&apos;s new?
            </p>
            <p
              style={{
                fontSize: "var(--text-display)",
                fontFamily: "var(--font-serif)",
                lineHeight: "var(--leading-tight)",
              }}
            >
              Display — Section Title
            </p>
            <p style={{ fontSize: "var(--text-headline)", fontWeight: 600 }}>
              Headline — Card Title
            </p>
            <p style={{ fontSize: "var(--text-title)", fontWeight: 600 }}>Title — Sub-section</p>
            <p style={{ fontSize: "var(--text-body)" }}>
              Body — Regular text for conversation and UI elements.
            </p>
            <p style={{ fontSize: "var(--text-body-sm)", color: "var(--ink-secondary)" }}>
              Body Small — Sidebar items, secondary text.
            </p>
            <p style={{ fontSize: "var(--text-caption)", color: "var(--ink-tertiary)" }}>
              Caption — Timestamps, labels.
            </p>
            <p style={{ fontSize: "var(--text-micro)", color: "var(--ink-tertiary)" }}>
              Micro — Smallest labels.
            </p>
            <p style={{ fontSize: "var(--text-body)", fontFamily: "var(--font-mono)" }}>
              Mono — code blocks and tool calls
            </p>
          </div>
        </Section>

        {/* ── Spacing ── */}
        <Section title="Spacing">
          <div className="flex items-end gap-[var(--space-2)]">
            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
              <div key={n} className="flex flex-col items-center gap-1">
                <div
                  className="bg-[var(--accent-muted)] rounded-[var(--radius-sm)]"
                  style={{ width: `var(--space-${n})`, height: `var(--space-${n})` }}
                />
                <span className="text-[var(--text-micro)] text-[var(--ink-tertiary)]">{n}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Radius ── */}
        <Section title="Radius">
          <div className="flex items-center gap-[var(--space-4)]">
            {(["sm", "md", "lg", "xl", "2xl", "full"] as const).map((r) => (
              <div key={r} className="flex flex-col items-center gap-1">
                <div
                  className="w-12 h-12 bg-[var(--accent-muted)] border border-[var(--accent)]"
                  style={{ borderRadius: `var(--radius-${r})` }}
                />
                <span className="text-[var(--text-micro)] text-[var(--ink-tertiary)]">{r}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Shadows ── */}
        <Section title="Shadows">
          <div className="flex items-center gap-[var(--space-6)]">
            {(["xs", "sm", "md", "lg"] as const).map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div
                  className="w-20 h-20 bg-[var(--surface)] rounded-[var(--radius-lg)]"
                  style={{ boxShadow: `var(--shadow-${s})` }}
                />
                <span className="text-[var(--text-micro)] text-[var(--ink-tertiary)]">{s}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Buttons ── */}
        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-[var(--space-3)]">
            <Button variant="primary">Primary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="primary" size="sm">
              Small
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </Section>

        {/* ── Inputs ── */}
        <Section title="Inputs">
          <div className="max-w-md space-y-[var(--space-3)]">
            <Input placeholder="Text input..." />
            <Input placeholder="Disabled" disabled />
            <Textarea placeholder="Textarea..." />
          </div>
        </Section>

        {/* ── Cards ── */}
        <Section title="Cards">
          <div className="grid grid-cols-2 gap-[var(--space-4)] max-w-2xl">
            <Card>
              <CardHeader>
                <span className="text-[var(--text-title)] font-semibold">Default Card</span>
              </CardHeader>
              <CardContent>A static card for displaying content. No hover interaction.</CardContent>
            </Card>
            <Card interactive>
              <CardHeader>
                <span className="text-[var(--text-title)] font-semibold">Interactive Card</span>
              </CardHeader>
              <CardContent>Hover to see the raised surface effect.</CardContent>
            </Card>
          </div>
        </Section>

        {/* ── Badges ── */}
        <Section title="Badges">
          <div className="flex flex-wrap items-center gap-[var(--space-2)]">
            <Badge>Default</Badge>
            <Badge variant="accent">Accent</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="error">Error</Badge>
          </div>
        </Section>

        {/* ── Tabs ── */}
        <Section title="Tabs">
          <Tabs defaultValue="tab1" className="max-w-md">
            <TabsList>
              <TabsTrigger value="tab1">General</TabsTrigger>
              <TabsTrigger value="tab2">Accounts</TabsTrigger>
              <TabsTrigger value="tab3">Skills</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">
              <p className="text-[var(--text-body-sm)] text-[var(--ink-secondary)]">
                General settings content.
              </p>
            </TabsContent>
            <TabsContent value="tab2">
              <p className="text-[var(--text-body-sm)] text-[var(--ink-secondary)]">
                API keys and accounts.
              </p>
            </TabsContent>
            <TabsContent value="tab3">
              <p className="text-[var(--text-body-sm)] text-[var(--ink-secondary)]">
                Skill management.
              </p>
            </TabsContent>
          </Tabs>
        </Section>

        {/* ── Modal ── */}
        <Section title="Modal">
          <Modal>
            <ModalTrigger asChild>
              <Button variant="outline">Open Modal</Button>
            </ModalTrigger>
            <ModalContent title="Settings" description="Configure your workspace.">
              <div className="space-y-[var(--space-3)]">
                <Input placeholder="API Key..." />
                <div className="flex justify-end gap-[var(--space-2)]">
                  <ModalClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </ModalClose>
                  <Button variant="primary">Save</Button>
                </div>
              </div>
            </ModalContent>
          </Modal>
        </Section>

        {/* ── Dropdown ── */}
        <Section title="Dropdown">
          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="outline">Model selector</Button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem>Claude Sonnet 4</DropdownItem>
              <DropdownItem>Claude Haiku 4.5</DropdownItem>
              <DropdownSeparator />
              <DropdownItem>GPT-5.4</DropdownItem>
              <DropdownItem>GPT-4o</DropdownItem>
            </DropdownContent>
          </Dropdown>
        </Section>

        {/* ── Tooltip ── */}
        <Section title="Tooltip">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>This is a tooltip</TooltipContent>
          </Tooltip>
        </Section>

        {/* ── Skeleton ── */}
        <Section title="Skeleton">
          <div className="max-w-md space-y-[var(--space-2)]">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Section>
      </div>
    </TooltipProvider>
  );
}
