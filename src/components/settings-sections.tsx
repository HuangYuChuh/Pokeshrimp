"use client";

import { useState } from "react";
import { Button, Chip, Accordion, Input, Select, ListBox, Switch, Card } from "@heroui/react";
import { Plus, Trash2, X, Server, Webhook, Shield } from "lucide-react";
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
    <Accordion>
      <Accordion.Item id="mcp-servers">
        <Accordion.Heading>
          <Accordion.Trigger>
            <Accordion.Indicator />
            <Server size={14} strokeWidth={1.5} />
            MCP Servers
          </Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body className="mt-2 space-y-3">
            {entries.length === 0 && !adding && (
              <p className="text-[12px] text-muted">No MCP servers configured.</p>
            )}
            {entries.map(([name, server]) => (
              <Card key={name}>
                <Card.Content className="flex items-center gap-2 px-3 py-2">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      server.enabled ? "bg-green-400" : "bg-muted/40",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[13px] font-medium">{name}</span>
                    <p className="truncate text-[12px] font-mono text-muted">
                      {server.command} {server.args.join(" ")}
                    </p>
                  </div>
                  <Switch size="sm" isSelected={server.enabled} onChange={() => handleToggle(name)}>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                  <Button
                    isIconOnly
                    variant="danger-soft"
                    size="sm"
                    onPress={() => handleRemove(name)}
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                  </Button>
                </Card.Content>
              </Card>
            ))}

            {adding && (
              <Card>
                <Card.Content className="space-y-2 p-3">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Server name"
                    fullWidth
                  />
                  <Input
                    value={newServer.command}
                    onChange={(e) => setNewServer({ ...newServer, command: e.target.value })}
                    placeholder="Command (e.g. npx -y @modelcontextprotocol/server)"
                    fullWidth
                    className="font-mono"
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
                    fullWidth
                    className="font-mono"
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
                    fullWidth
                    className="font-mono"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => {
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
                      onPress={handleAdd}
                      isDisabled={!newName.trim() || !newServer.command.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            )}

            {!adding && (
              <Button variant="outline" size="sm" onPress={() => setAdding(true)}>
                <Plus size={13} strokeWidth={2} className="mr-1" />
                Add Server
              </Button>
            )}
          </Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
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

  return (
    <Accordion>
      <Accordion.Item id="hooks">
        <Accordion.Heading>
          <Accordion.Trigger>
            <Accordion.Indicator />
            <Webhook size={14} strokeWidth={1.5} />
            Hooks
          </Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body className="mt-2 space-y-3">
            {allEvents.size === 0 && !adding && (
              <p className="text-[12px] text-muted">No hooks configured.</p>
            )}

            {/* Convention hooks */}
            {conventionHooks.map((event) => (
              <Card key={`conv-${event}`}>
                <Card.Content className="flex items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium">{event}</span>
                      <Chip size="sm" variant="soft" className="text-[10px]">
                        convention
                      </Chip>
                    </div>
                    <p className="text-[12px] font-mono text-muted">.visagent/hooks/{event}</p>
                  </div>
                </Card.Content>
              </Card>
            ))}

            {/* Config hooks */}
            {Object.entries(hooks).map(([event, entries]) =>
              entries.map((entry, i) => (
                <Card key={`${event}-${i}`}>
                  <Card.Content className="flex items-center gap-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">{event}</span>
                      </div>
                      <p className="truncate text-[12px] font-mono text-muted">{entry.command}</p>
                      <div className="mt-0.5 flex gap-3 text-[11px] text-muted">
                        <span>timeout: {entry.timeout}ms</span>
                        {entry.matcher && <span>matcher: {entry.matcher}</span>}
                      </div>
                    </div>
                    <Button
                      isIconOnly
                      variant="danger-soft"
                      size="sm"
                      onPress={() => handleRemove(event, i)}
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                    </Button>
                  </Card.Content>
                </Card>
              )),
            )}

            {adding && (
              <Card>
                <Card.Content className="space-y-2 p-3">
                  <Select
                    selectedKey={newEvent}
                    onSelectionChange={(key) => {
                      if (key) setNewEvent(String(key));
                    }}
                    fullWidth
                  >
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {HOOK_EVENTS.map((ev) => (
                          <ListBox.Item key={ev} id={ev} textValue={ev}>
                            {ev}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                  <Input
                    value={newCommand}
                    onChange={(e) => setNewCommand(e.target.value)}
                    placeholder="Command (e.g. ./scripts/validate.sh)"
                    fullWidth
                    className="font-mono"
                  />
                  <div className="flex gap-2">
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
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => {
                        setAdding(false);
                        setNewCommand("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onPress={handleAdd}
                      isDisabled={!newCommand.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            )}

            {!adding && (
              <Button variant="outline" size="sm" onPress={() => setAdding(true)}>
                <Plus size={13} strokeWidth={2} className="mr-1" />
                Add Hook
              </Button>
            )}

            <p className="text-[11px] text-muted">See docs/hook-events.md for event reference.</p>
          </Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
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
      <label className="mb-1.5 block text-[12px] font-medium text-foreground">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {patterns.map((p, i) => (
          <Chip key={`${p}-${i}`} size="sm" variant="soft" className="font-mono">
            {p}
            <button
              type="button"
              className="ml-1 text-muted transition-colors hover:text-danger"
              onClick={() => handleRemove(i)}
            >
              <X size={11} strokeWidth={2} />
            </button>
          </Chip>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="comfyui-cli *"
          fullWidth
          className="font-mono"
        />
        <Button variant="outline" size="sm" onPress={handleAdd} isDisabled={!input.trim()}>
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
    <Accordion>
      <Accordion.Item id="permissions">
        <Accordion.Heading>
          <Accordion.Trigger>
            <Accordion.Indicator />
            <Shield size={14} strokeWidth={1.5} />
            Permissions
          </Accordion.Trigger>
        </Accordion.Heading>
        <Accordion.Panel>
          <Accordion.Body className="mt-2 space-y-4">
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
          </Accordion.Body>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}
