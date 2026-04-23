"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Card,
  CardContent,
  Chip,
  Input,
  Select,
  Switch,
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

interface SettingsTabHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

interface SettingsSectionProps {
  label: string;
  hint?: string;
  htmlFor?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SettingsTabHeader({ title, description, action }: SettingsTabHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-[var(--space-4)] max-[520px]:flex-col">
      <div className="min-w-0 flex-1">
        <h3 className="text-[var(--text-headline)] font-semibold text-[var(--ink)]">{title}</h3>
        <p className="mt-[var(--space-1)] text-[var(--text-body-sm)] text-[var(--ink-tertiary)]">
          {description}
        </p>
      </div>
      {action ? (
        <div className="flex shrink-0 items-center max-[520px]:w-full max-[520px]:justify-start">
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function SettingsSection({
  label,
  hint,
  htmlFor,
  action,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-[var(--space-2)]", className)}>
      <div className="flex flex-wrap items-start justify-between gap-[var(--space-3)] max-[520px]:flex-col">
        <div className="min-w-0 flex-1">
          {htmlFor ? (
            <label
              htmlFor={htmlFor}
              className="block text-[var(--text-title)] font-medium text-[var(--ink)]"
            >
              {label}
            </label>
          ) : (
            <div className="block text-[var(--text-title)] font-medium text-[var(--ink)]">
              {label}
            </div>
          )}
          {hint ? (
            <p className="mt-[var(--space-1)] text-[var(--text-caption)] text-[var(--ink-tertiary)]">
              {hint}
            </p>
          ) : null}
        </div>
        {action ? (
          <div className="flex shrink-0 items-center max-[520px]:w-full max-[520px]:justify-start">
            {action}
          </div>
        ) : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
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

  function handleReset() {
    setAdding(false);
    setNewName("");
    setNewServer({ ...EMPTY_SERVER });
  }

  function handleAdd() {
    if (!newName.trim() || !newServer.command.trim()) return;
    const updated = { ...servers };
    updated[newName.trim()] = { ...newServer };
    onChange(updated);
    handleReset();
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="mcp-servers">
        <AccordionTrigger>
          <span className="flex min-w-0 items-center gap-[var(--gap-inline)]">
            <Icon icon="solar:server-outline" width={14} className="shrink-0" />
            <span className="truncate">MCP Servers</span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="mt-[var(--space-2)] space-y-[var(--space-3)]">
            {entries.length === 0 && !adding ? (
              <p className="text-[var(--text-caption)] text-[var(--ink-tertiary)]">
                No MCP servers configured.
              </p>
            ) : null}

            {entries.map(([name, server]) => {
              const commandLine = `${server.command} ${server.args.join(" ")}`.trim();

              return (
                <Card key={name} className="overflow-hidden">
                  <CardContent className="flex min-w-0 flex-wrap items-start gap-[var(--space-3)] px-[var(--space-3)] py-[var(--space-2)] leading-[var(--leading-normal)] max-[560px]:flex-col">
                    <span
                      className={cn(
                        "mt-[var(--space-1)] h-[var(--space-2)] w-[var(--space-2)] shrink-0 rounded-full",
                        server.enabled ? "bg-[var(--success)]" : "bg-[var(--border-strong)]",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[var(--text-body-sm)] font-medium text-[var(--ink)]"
                        title={name}
                      >
                        {name}
                      </span>
                      <p
                        className="truncate text-[var(--text-caption)] font-[var(--font-mono)] text-[var(--ink-tertiary)]"
                        title={commandLine}
                      >
                        {commandLine}
                      </p>
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-[var(--space-2)] max-[560px]:ml-0">
                      <Switch
                        checked={server.enabled}
                        onChange={() => handleToggle(name)}
                        aria-label={`Toggle ${name}`}
                        className="shrink-0"
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemove(name)}
                        className="h-[var(--space-6)] w-[var(--space-6)] min-w-0 p-0"
                        aria-label={`Remove ${name}`}
                      >
                        <Icon icon="solar:trash-bin-2-outline" width={13} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {adding ? (
              <Card>
                <CardContent className="space-y-[var(--space-3)] p-[var(--padding-card)] leading-[var(--leading-normal)]">
                  <SettingsSection label="Server Name" htmlFor="mcp-server-name">
                    <Input
                      id="mcp-server-name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Server name"
                      className="w-full"
                    />
                  </SettingsSection>

                  <SettingsSection
                    label="Command"
                    hint="Executable or shell command used to start the server"
                    htmlFor="mcp-server-command"
                  >
                    <Input
                      id="mcp-server-command"
                      value={newServer.command}
                      onChange={(e) => setNewServer({ ...newServer, command: e.target.value })}
                      placeholder="Command (e.g. npx -y @modelcontextprotocol/server)"
                      className="w-full font-[var(--font-mono)]"
                    />
                  </SettingsSection>

                  <SettingsSection label="Arguments" htmlFor="mcp-server-args">
                    <Input
                      id="mcp-server-args"
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
                  </SettingsSection>

                  <SettingsSection label="Environment Variables" htmlFor="mcp-server-env">
                    <Input
                      id="mcp-server-env"
                      value={Object.entries(newServer.env)
                        .map(([key, value]) => `${key}=${value}`)
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
                  </SettingsSection>

                  <div className="flex flex-wrap justify-end gap-[var(--space-2)] max-[560px]:flex-col-reverse">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="max-[560px]:w-full"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAdd}
                      disabled={!newName.trim() || !newServer.command.trim()}
                      className="max-[560px]:w-full"
                    >
                      Add Server
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {!adding ? (
              <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
                <Icon icon="solar:add-circle-outline" width={13} />
                Add Server
              </Button>
            ) : null}
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

  function handleReset() {
    setAdding(false);
    setNewEvent(HOOK_EVENTS[0]);
    setNewCommand("");
    setNewTimeout("10000");
    setNewMatcher("");
  }

  function handleAdd() {
    if (!newCommand.trim()) return;
    const updated = { ...hooks };
    const entry: HookEntryConfig = {
      command: newCommand.trim(),
      timeout: Number.parseInt(newTimeout, 10) || 10000,
    };
    if (newMatcher.trim()) entry.matcher = newMatcher.trim();
    updated[newEvent] = [...(updated[newEvent] ?? []), entry];
    onChange(updated);
    handleReset();
  }

  const allEvents = new Set([...Object.keys(hooks), ...conventionHooks]);
  const eventOptions = HOOK_EVENTS.map((event) => ({ value: event, label: event }));

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="hooks">
        <AccordionTrigger>
          <span className="flex min-w-0 items-center gap-[var(--gap-inline)]">
            <Icon icon="solar:link-circle-outline" width={14} className="shrink-0" />
            <span className="truncate">Hooks</span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="mt-[var(--space-2)] space-y-[var(--space-3)]">
            {allEvents.size === 0 && !adding ? (
              <p className="text-[var(--text-caption)] text-[var(--ink-tertiary)]">
                No hooks configured.
              </p>
            ) : null}

            {conventionHooks.map((event) => (
              <Card key={`conv-${event}`} className="overflow-hidden">
                <CardContent className="flex min-w-0 items-start gap-[var(--space-3)] px-[var(--space-3)] py-[var(--space-2)] leading-[var(--leading-normal)]">
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-[var(--space-2)]">
                      <span
                        className="truncate text-[var(--text-body-sm)] font-medium text-[var(--ink)]"
                        title={event}
                      >
                        {event}
                      </span>
                      <Chip size="sm">Convention</Chip>
                    </div>
                    <p
                      className="truncate text-[var(--text-caption)] font-[var(--font-mono)] text-[var(--ink-tertiary)]"
                      title={`.visagent/hooks/${event}`}
                    >
                      .visagent/hooks/{event}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {Object.entries(hooks).flatMap(([event, entries]) =>
              entries.map((entry, index) => (
                <Card key={`${event}-${index}`} className="overflow-hidden">
                  <CardContent className="flex min-w-0 flex-wrap items-start gap-[var(--space-3)] px-[var(--space-3)] py-[var(--space-2)] leading-[var(--leading-normal)] max-[560px]:flex-col">
                    <div className="min-w-0 flex-1">
                      <span
                        className="block truncate text-[var(--text-body-sm)] font-medium text-[var(--ink)]"
                        title={event}
                      >
                        {event}
                      </span>
                      <p
                        className="truncate text-[var(--text-caption)] font-[var(--font-mono)] text-[var(--ink-tertiary)]"
                        title={entry.command}
                      >
                        {entry.command}
                      </p>
                      <div className="mt-[var(--space-1)] flex flex-wrap gap-[var(--space-3)] text-[var(--text-micro)] text-[var(--ink-tertiary)]">
                        <span className="font-[var(--font-mono)]">timeout: {entry.timeout}ms</span>
                        {entry.matcher ? (
                          <span className="break-all font-[var(--font-mono)]">
                            matcher: {entry.matcher}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemove(event, index)}
                      className="h-[var(--space-6)] w-[var(--space-6)] min-w-0 p-0"
                      aria-label={`Remove ${event} hook`}
                    >
                      <Icon icon="solar:trash-bin-2-outline" width={13} />
                    </Button>
                  </CardContent>
                </Card>
              )),
            )}

            {adding ? (
              <Card>
                <CardContent className="space-y-[var(--space-3)] p-[var(--padding-card)] leading-[var(--leading-normal)]">
                  <SettingsSection label="Event">
                    <Select
                      value={newEvent}
                      onChange={setNewEvent}
                      options={eventOptions}
                      className="w-full"
                    />
                  </SettingsSection>

                  <SettingsSection label="Command" htmlFor="hook-command">
                    <Input
                      id="hook-command"
                      value={newCommand}
                      onChange={(e) => setNewCommand(e.target.value)}
                      placeholder="Command (e.g. ./scripts/validate.sh)"
                      className="w-full font-[var(--font-mono)]"
                    />
                  </SettingsSection>

                  <div className="grid grid-cols-2 gap-[var(--space-3)] max-[560px]:grid-cols-1">
                    <SettingsSection label="Timeout" htmlFor="hook-timeout">
                      <Input
                        id="hook-timeout"
                        value={newTimeout}
                        onChange={(e) => setNewTimeout(e.target.value)}
                        placeholder="Timeout (ms)"
                        className="w-full font-[var(--font-mono)]"
                      />
                    </SettingsSection>
                    <SettingsSection
                      label="Matcher"
                      htmlFor="hook-matcher"
                      hint="Optional pattern filter"
                    >
                      <Input
                        id="hook-matcher"
                        value={newMatcher}
                        onChange={(e) => setNewMatcher(e.target.value)}
                        placeholder="Matcher (optional)"
                        className="w-full font-[var(--font-mono)]"
                      />
                    </SettingsSection>
                  </div>

                  <div className="flex flex-wrap justify-end gap-[var(--space-2)] max-[560px]:flex-col-reverse">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      className="max-[560px]:w-full"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAdd}
                      disabled={!newCommand.trim()}
                      className="max-[560px]:w-full"
                    >
                      Add Hook
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {!adding ? (
              <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
                <Icon icon="solar:add-circle-outline" width={13} />
                Add Hook
              </Button>
            ) : null}

            <p className="text-[var(--text-micro)] leading-[var(--leading-normal)] text-[var(--ink-tertiary)]">
              See <span className="font-[var(--font-mono)]">docs/hook-events.md</span> for event
              reference.
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
  const inputId = `permission-${label.toLowerCase().replace(/\s+/g, "-")}`;

  function handleAdd() {
    const value = input.trim();
    if (!value || patterns.includes(value)) return;
    onChange([...patterns, value]);
    setInput("");
  }

  function handleRemove(index: number) {
    onChange(patterns.filter((_, currentIndex) => currentIndex !== index));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-[var(--space-2)]">
      <label htmlFor={inputId} className="text-[var(--text-caption)] font-medium text-[var(--ink)]">
        {label}
      </label>

      {patterns.length > 0 ? (
        <div className="flex min-w-0 flex-wrap gap-[var(--space-2)]">
          {patterns.map((pattern, index) => (
            <Chip
              key={`${pattern}-${index}`}
              size="sm"
              className="max-w-full font-[var(--font-mono)]"
              title={pattern}
            >
              <span className="block max-w-[20rem] truncate max-[560px]:max-w-[12rem]">
                {pattern}
              </span>
              <button
                type="button"
                className="ml-[var(--space-1)] text-[var(--ink-tertiary)] transition-colors hover:text-[var(--error)]"
                onClick={() => handleRemove(index)}
                aria-label={`Remove ${pattern}`}
              >
                <Icon icon="solar:close-circle-outline" width={11} />
              </button>
            </Chip>
          ))}
        </div>
      ) : null}

      <div className="flex min-w-0 gap-[var(--space-2)] max-[560px]:flex-col">
        <Input
          id={inputId}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="comfyui-cli *"
          className="w-full font-[var(--font-mono)]"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!input.trim()}
          className="max-[560px]:w-full"
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
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="permissions">
        <AccordionTrigger>
          <span className="flex min-w-0 items-center gap-[var(--gap-inline)]">
            <Icon icon="solar:shield-outline" width={14} className="shrink-0" />
            <span className="truncate">Permissions</span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="mt-[var(--space-2)] space-y-[var(--space-4)]">
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
