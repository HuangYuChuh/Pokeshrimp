"use client";

import { useState } from "react";
import {
  Button,
  Chip,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Input,
  Select,
  Switch,
  Card,
  CardContent,
} from "@/design-system/components";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

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
  const [newServer, setNewServer] = useState<McpServerConfig>({ ...EMPTY_SERVER });

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
    updated[newName.trim()] = { ...newServer };
    onChange(updated);
    setNewName("");
    setNewServer({ ...EMPTY_SERVER });
    setAdding(false);
  }

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="mcp-servers">
        <AccordionTrigger>
          <span className="flex items-center gap-[var(--gap-inline)]">
            <Icon icon="solar:server-outline" width={14} />
            MCP Servers
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="mt-2 space-y-[var(--space-3)]">
            {entries.length === 0 && !adding && (
              <p className="text-[var(--text-caption)] text-[var(--ink-tertiary)]">
                No MCP servers configured.
              </p>
            )}
            {entries.map(([name, server]) => (
              <Card key={name}>
                <CardContent className="flex items-center gap-[var(--gap-inline)] px-[var(--space-3)] py-2">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      server.enabled ? "bg-[var(--success)]" : "bg-[var(--border-strong)]",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[var(--text-body-sm)] font-medium">{name}</span>
                    <p className="truncate text-[var(--text-caption)] font-[var(--font-mono)] text-[var(--ink-tertiary)]">
                      {server.command} {server.args.join(" ")}
                    </p>
                  </div>
                  <Switch
                    checked={server.enabled}
                    onChange={() => handleToggle(name)}
                    aria-label={`Toggle ${name}`}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemove(name)}
                    className="h-6 w-6 min-w-0 p-0"
                    aria-label={`Remove ${name}`}
                  >
                    <Icon icon="solar:trash-bin-2-outline" width={13} />
                  </Button>
                </CardContent>
              </Card>
            ))}

            {adding && (
              <Card>
                <CardContent className="space-y-[var(--space-2)] p-3">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Server name"
                    className="w-full"
                  />
                  <Input
                    value={newServer.command}
                    onChange={(e) => setNewServer({ ...newServer, command: e.target.value })}
                    placeholder="Command (e.g. npx -y @modelcontextprotocol/server)"
                    className="w-full font-[var(--font-mono)]"
                  />
                  <Input
                    value={newServer.args.join(" ")}
                    onChange={(e) =>
                      setNewServer({
                        ...newServer,
                        args: e.target.value ? e.target.value.split(" ") : [],
                      })
                    }
                    placeholder="Args (space separated)"
                    className="w-full font-[var(--font-mono)]"
                  />
                  <Input
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
                    className="w-full font-[var(--font-mono)]"
                  />
                  <div className="flex justify-end gap-[var(--gap-inline)]">
                    <Button
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
                      variant="primary"
                      size="sm"
                      onClick={handleAdd}
                      disabled={!newName.trim() || !newServer.command.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!adding && (
              <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
                <Icon icon="solar:add-circle-outline" width={13} className="mr-1" />
                Add Server
              </Button>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
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

  const allEvents = new Set([...Object.keys(hooks), ...conventionHooks]);
  const eventOptions = HOOK_EVENTS.map((ev) => ({ value: ev, label: ev }));

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="hooks">
        <AccordionTrigger>
          <span className="flex items-center gap-[var(--gap-inline)]">
            <Icon icon="solar:link-circle-outline" width={14} />
            Hooks
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="mt-2 space-y-[var(--space-3)]">
            {allEvents.size === 0 && !adding && (
              <p className="text-[var(--text-caption)] text-[var(--ink-tertiary)]">
                No hooks configured.
              </p>
            )}

            {conventionHooks.map((event) => (
              <Card key={`conv-${event}`}>
                <CardContent className="flex items-center gap-[var(--gap-inline)] px-[var(--space-3)] py-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-[var(--gap-inline)]">
                      <span className="text-[var(--text-body-sm)] font-medium">{event}</span>
                      <Chip size="sm">convention</Chip>
                    </div>
                    <p className="text-[var(--text-caption)] font-[var(--font-mono)] text-[var(--ink-tertiary)]">
                      .visagent/hooks/{event}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {Object.entries(hooks).map(([event, entries]) =>
              entries.map((entry, i) => (
                <Card key={`${event}-${i}`}>
                  <CardContent className="flex items-center gap-[var(--gap-inline)] px-[var(--space-3)] py-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[var(--text-body-sm)] font-medium">{event}</span>
                      <p className="truncate text-[var(--text-caption)] font-[var(--font-mono)] text-[var(--ink-tertiary)]">
                        {entry.command}
                      </p>
                      <div className="mt-0.5 flex gap-3 text-[var(--text-micro)] text-[var(--ink-tertiary)]">
                        <span>timeout: {entry.timeout}ms</span>
                        {entry.matcher && <span>matcher: {entry.matcher}</span>}
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemove(event, i)}
                      className="h-6 w-6 min-w-0 p-0"
                      aria-label={`Remove ${event} hook`}
                    >
                      <Icon icon="solar:trash-bin-2-outline" width={13} />
                    </Button>
                  </CardContent>
                </Card>
              )),
            )}

            {adding && (
              <Card>
                <CardContent className="space-y-[var(--space-2)] p-3">
                  <Select
                    value={newEvent}
                    onChange={setNewEvent}
                    options={eventOptions}
                    className="w-full"
                  />
                  <Input
                    value={newCommand}
                    onChange={(e) => setNewCommand(e.target.value)}
                    placeholder="Command (e.g. ./scripts/validate.sh)"
                    className="w-full font-[var(--font-mono)]"
                  />
                  <div className="flex gap-[var(--gap-inline)]">
                    <Input
                      value={newTimeout}
                      onChange={(e) => setNewTimeout(e.target.value)}
                      placeholder="Timeout (ms)"
                      className="w-1/2"
                    />
                    <Input
                      value={newMatcher}
                      onChange={(e) => setNewMatcher(e.target.value)}
                      placeholder="Matcher (optional)"
                      className="w-1/2"
                    />
                  </div>
                  <div className="flex justify-end gap-[var(--gap-inline)]">
                    <Button
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
                      variant="primary"
                      size="sm"
                      onClick={handleAdd}
                      disabled={!newCommand.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!adding && (
              <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
                <Icon icon="solar:add-circle-outline" width={13} className="mr-1" />
                Add Hook
              </Button>
            )}

            <p className="text-[var(--text-micro)] text-[var(--ink-tertiary)]">
              See docs/hook-events.md for event reference.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
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
      <label className="mb-1.5 block text-[var(--text-caption)] font-medium text-[var(--ink)]">
        {label}
      </label>
      <div className="flex flex-wrap gap-[var(--space-2)]">
        {patterns.map((p, i) => (
          <Chip key={`${p}-${i}`} size="sm" className="font-[var(--font-mono)]">
            {p}
            <button
              type="button"
              className="ml-1 text-[var(--ink-tertiary)] transition-colors hover:text-[var(--error)]"
              onClick={() => handleRemove(i)}
            >
              <Icon icon="solar:close-circle-outline" width={11} />
            </button>
          </Chip>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[var(--gap-inline)]">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="comfyui-cli *"
          className="w-full font-[var(--font-mono)]"
        />
        <Button variant="outline" size="sm" onClick={handleAdd} disabled={!input.trim()}>
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
    <Accordion type="single" collapsible>
      <AccordionItem value="permissions">
        <AccordionTrigger>
          <span className="flex items-center gap-[var(--gap-inline)]">
            <Icon icon="solar:shield-outline" width={14} />
            Permissions
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="mt-2 space-y-4">
            <PatternList
              label="Always Allow"
              patterns={permissions.alwaysAllow}
              onChange={(alwaysAllow) => onChange({ ...permissions, alwaysAllow })}
            />
            <PatternList
              label="Always Deny"
              patterns={permissions.alwaysDeny}
              onChange={(alwaysDeny) => onChange({ ...permissions, alwaysDeny })}
            />
            <PatternList
              label="Always Ask"
              patterns={permissions.alwaysAsk}
              onChange={(alwaysAsk) => onChange({ ...permissions, alwaysAsk })}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
