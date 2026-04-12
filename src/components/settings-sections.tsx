"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Plus,
  Trash2,
  X,
  Server,
  Webhook,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Collapsible Section wrapper
// ---------------------------------------------------------------------------

function CollapsibleSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted/50"
        onClick={() => setOpen(!open)}
      >
        <ChevronRight
          size={14}
          strokeWidth={2}
          className={cn(
            "shrink-0 transition-transform",
            open && "rotate-90",
          )}
        />
        <Icon size={14} strokeWidth={1.5} />
        {title}
      </button>
      {open && <div className="mt-2 space-y-3 pl-1">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Types matching config schema
// ---------------------------------------------------------------------------

export interface McpServerConfig {
  command: string;
  args: string[];
  env: Record<string, string>;
  transport: "stdio" | "sse" | "http";
  enabled: boolean;
}

export interface HookEntryConfig {
  command: string;
  timeout: number;
  matcher?: string;
}

export interface PermissionConfig {
  alwaysAllow: string[];
  alwaysDeny: string[];
  alwaysAsk: string[];
}

// ---------------------------------------------------------------------------
// MCP Servers Section
// ---------------------------------------------------------------------------

const EMPTY_SERVER: McpServerConfig = {
  command: "",
  args: [],
  env: {},
  transport: "stdio",
  enabled: true,
};

export function McpServersSection({
  servers,
  onChange,
}: {
  servers: Record<string, McpServerConfig>;
  onChange: (servers: Record<string, McpServerConfig>) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newServer, setNewServer] = useState<McpServerConfig>({
    ...EMPTY_SERVER,
  });

  const entries = Object.entries(servers);

  function handleToggle(name: string) {
    const updated = { ...servers };
    updated[name] = { ...updated[name], enabled: !updated[name].enabled };
    onChange(updated);
  }

  function handleRemove(name: string) {
    const updated = { ...servers };
    delete updated[name];
    onChange(updated);
  }

  function handleAdd() {
    if (!newName.trim() || !newServer.command.trim()) return;
    const updated = { ...servers };
    updated[newName.trim()] = {
      ...newServer,
      args: newServer.args,
    };
    onChange(updated);
    setNewName("");
    setNewServer({ ...EMPTY_SERVER });
    setAdding(false);
  }

  return (
    <CollapsibleSection title="MCP Servers" icon={Server}>
      {entries.length === 0 && !adding && (
        <p className="text-[12px] text-muted-foreground">
          No MCP servers configured.
        </p>
      )}
      {entries.map(([name, server]) => (
        <div
          key={name}
          className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
        >
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              server.enabled ? "bg-green-400" : "bg-muted-foreground/40",
            )}
          />
          <div className="min-w-0 flex-1">
            <span className="text-[13px] font-medium">{name}</span>
            <p className="truncate text-[12px] font-mono text-muted-foreground">
              {server.command} {server.args.join(" ")}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => handleToggle(name)}
          >
            <span className="text-[11px]">
              {server.enabled ? "On" : "Off"}
            </span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
            onClick={() => handleRemove(name)}
          >
            <Trash2 size={13} strokeWidth={1.5} />
          </Button>
        </div>
      ))}

      {adding && (
        <div className="space-y-2 rounded-lg border border-border bg-background p-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Server name"
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="text"
            value={newServer.command}
            onChange={(e) =>
              setNewServer({ ...newServer, command: e.target.value })
            }
            placeholder="Command (e.g. npx -y @modelcontextprotocol/server)"
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="text"
            value={newServer.args.join(" ")}
            onChange={(e) =>
              setNewServer({
                ...newServer,
                args: e.target.value ? e.target.value.split(" ") : [],
              })
            }
            placeholder="Args (space separated)"
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
          />
          <input
            type="text"
            value={Object.entries(newServer.env)
              .map(([k, v]) => `${k}=${v}`)
              .join(" ")}
            onChange={(e) => {
              const env: Record<string, string> = {};
              e.target.value
                .split(" ")
                .filter(Boolean)
                .forEach((pair) => {
                  const idx = pair.indexOf("=");
                  if (idx > 0) env[pair.slice(0, idx)] = pair.slice(idx + 1);
                });
              setNewServer({ ...newServer, env });
            }}
            placeholder="Env vars (KEY=VALUE KEY2=VALUE2)"
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAdding(false);
                setNewName("");
                setNewServer({ ...EMPTY_SERVER });
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              disabled={!newName.trim() || !newServer.command.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {!adding && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-[12px]"
          onClick={() => setAdding(true)}
        >
          <Plus size={13} strokeWidth={2} className="mr-1" />
          Add Server
        </Button>
      )}
    </CollapsibleSection>
  );
}

// ---------------------------------------------------------------------------
// Hooks Section
// ---------------------------------------------------------------------------

const HOOK_EVENTS = [
  "session-start",
  "pre-tool-call",
  "post-tool-call",
  "post-generate",
  "pre-export",
  "on-error",
  "on-approve",
  "session-end",
] as const;

export function HooksSection({
  hooks,
  conventionHooks,
  onChange,
}: {
  hooks: Record<string, HookEntryConfig[]>;
  conventionHooks: string[];
  onChange: (hooks: Record<string, HookEntryConfig[]>) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newEvent, setNewEvent] = useState<string>(HOOK_EVENTS[0]);
  const [newCommand, setNewCommand] = useState("");
  const [newTimeout, setNewTimeout] = useState("10000");
  const [newMatcher, setNewMatcher] = useState("");

  function handleRemove(event: string, index: number) {
    const updated = { ...hooks };
    const list = [...(updated[event] ?? [])];
    list.splice(index, 1);
    if (list.length === 0) {
      delete updated[event];
    } else {
      updated[event] = list;
    }
    onChange(updated);
  }

  function handleAdd() {
    if (!newCommand.trim()) return;
    const updated = { ...hooks };
    const entry: HookEntryConfig = {
      command: newCommand.trim(),
      timeout: parseInt(newTimeout, 10) || 10000,
    };
    if (newMatcher.trim()) entry.matcher = newMatcher.trim();
    updated[newEvent] = [...(updated[newEvent] ?? []), entry];
    onChange(updated);
    setNewCommand("");
    setNewTimeout("10000");
    setNewMatcher("");
    setAdding(false);
  }

  const allEvents = new Set([
    ...Object.keys(hooks),
    ...conventionHooks,
  ]);

  return (
    <CollapsibleSection title="Hooks" icon={Webhook}>
      {allEvents.size === 0 && !adding && (
        <p className="text-[12px] text-muted-foreground">
          No hooks configured.
        </p>
      )}

      {/* Convention hooks */}
      {conventionHooks.map((event) => (
        <div
          key={`conv-${event}`}
          className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium">{event}</span>
              <Badge variant="secondary" className="text-[10px]">
                convention
              </Badge>
            </div>
            <p className="text-[12px] font-mono text-muted-foreground">
              .visagent/hooks/{event}
            </p>
          </div>
        </div>
      ))}

      {/* Config hooks */}
      {Object.entries(hooks).map(([event, entries]) =>
        entries.map((entry, i) => (
          <div
            key={`${event}-${i}`}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium">{event}</span>
              </div>
              <p className="truncate text-[12px] font-mono text-muted-foreground">
                {entry.command}
              </p>
              <div className="mt-0.5 flex gap-3 text-[11px] text-muted-foreground">
                <span>timeout: {entry.timeout}ms</span>
                {entry.matcher && <span>matcher: {entry.matcher}</span>}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
              onClick={() => handleRemove(event, i)}
            >
              <Trash2 size={13} strokeWidth={1.5} />
            </Button>
          </div>
        )),
      )}

      {adding && (
        <div className="space-y-2 rounded-lg border border-border bg-background p-3">
          <select
            value={newEvent}
            onChange={(e) => setNewEvent(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
          >
            {HOOK_EVENTS.map((ev) => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newCommand}
            onChange={(e) => setNewCommand(e.target.value)}
            placeholder="Command (e.g. ./scripts/validate.sh)"
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newTimeout}
              onChange={(e) => setNewTimeout(e.target.value)}
              placeholder="Timeout (ms)"
              className="w-1/2 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
            <input
              type="text"
              value={newMatcher}
              onChange={(e) => setNewMatcher(e.target.value)}
              placeholder="Matcher (optional)"
              className="w-1/2 rounded-lg border border-border bg-background px-3 py-1.5 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAdding(false);
                setNewCommand("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              disabled={!newCommand.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {!adding && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-[12px]"
          onClick={() => setAdding(true)}
        >
          <Plus size={13} strokeWidth={2} className="mr-1" />
          Add Hook
        </Button>
      )}

      <p className="text-[11px] text-muted-foreground">
        See docs/hook-events.md for event reference.
      </p>
    </CollapsibleSection>
  );
}

// ---------------------------------------------------------------------------
// Permissions Section
// ---------------------------------------------------------------------------

function PatternList({
  label,
  patterns,
  onChange,
}: {
  label: string;
  patterns: string[];
  onChange: (patterns: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function handleAdd() {
    const val = input.trim();
    if (!val || patterns.includes(val)) return;
    onChange([...patterns, val]);
    setInput("");
  }

  function handleRemove(index: number) {
    onChange(patterns.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-foreground">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {patterns.map((p, i) => (
          <span
            key={`${p}-${i}`}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[12px] text-foreground"
          >
            {p}
            <button
              type="button"
              className="ml-0.5 text-muted-foreground transition-colors hover:text-destructive"
              onClick={() => handleRemove(i)}
            >
              <X size={11} strokeWidth={2} />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="comfyui-cli *"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[13px] text-foreground outline-none focus:ring-1 focus:ring-ring"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!input.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

export function PermissionsSection({
  permissions,
  onChange,
}: {
  permissions: PermissionConfig;
  onChange: (permissions: PermissionConfig) => void;
}) {
  return (
    <CollapsibleSection title="Permissions" icon={Shield}>
      <div className="space-y-4">
        <PatternList
          label="Always Allow"
          patterns={permissions.alwaysAllow}
          onChange={(alwaysAllow) =>
            onChange({ ...permissions, alwaysAllow })
          }
        />
        <PatternList
          label="Always Deny"
          patterns={permissions.alwaysDeny}
          onChange={(alwaysDeny) =>
            onChange({ ...permissions, alwaysDeny })
          }
        />
        <PatternList
          label="Always Ask"
          patterns={permissions.alwaysAsk}
          onChange={(alwaysAsk) =>
            onChange({ ...permissions, alwaysAsk })
          }
        />
      </div>
    </CollapsibleSection>
  );
}
