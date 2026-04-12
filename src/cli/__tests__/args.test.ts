import { describe, it, expect } from "vitest";
import { parseArgs, getHelpText } from "@/cli/args";

/** Helper: simulate process.argv with node + script prefix */
function argv(...args: string[]): string[] {
  return ["node", "pokeshrimp", ...args];
}

describe("parseArgs", () => {
  it("returns defaults with no arguments", () => {
    const opts = parseArgs(argv());
    expect(opts).toEqual({
      quiet: false,
      json: false,
      help: false,
      version: false,
    });
    expect(opts.message).toBeUndefined();
    expect(opts.model).toBeUndefined();
    expect(opts.cwd).toBeUndefined();
    expect(opts.configPath).toBeUndefined();
  });

  it("parses -h flag", () => {
    expect(parseArgs(argv("-h")).help).toBe(true);
    expect(parseArgs(argv("--help")).help).toBe(true);
  });

  it("parses -v flag", () => {
    expect(parseArgs(argv("-v")).version).toBe(true);
    expect(parseArgs(argv("--version")).version).toBe(true);
  });

  it("parses -q flag", () => {
    expect(parseArgs(argv("-q")).quiet).toBe(true);
    expect(parseArgs(argv("--quiet")).quiet).toBe(true);
  });

  it("parses --json flag", () => {
    expect(parseArgs(argv("--json")).json).toBe(true);
  });

  it("parses -m with value", () => {
    expect(parseArgs(argv("-m", "gpt-4o")).model).toBe("gpt-4o");
    expect(parseArgs(argv("--model", "claude-haiku")).model).toBe(
      "claude-haiku",
    );
  });

  it("parses -c with value", () => {
    expect(parseArgs(argv("-c", "/tmp")).cwd).toBe("/tmp");
    expect(parseArgs(argv("--cwd", "/home")).cwd).toBe("/home");
  });

  it("parses --config with value", () => {
    expect(parseArgs(argv("--config", "/path/to/config.json")).configPath).toBe(
      "/path/to/config.json",
    );
  });

  it("captures positional message", () => {
    expect(parseArgs(argv("hello world")).message).toBe("hello world");
  });

  it("joins multiple positional words into one message", () => {
    expect(parseArgs(argv("list", "files", "here")).message).toBe(
      "list files here",
    );
  });

  it("handles flags before positional message", () => {
    const opts = parseArgs(argv("-q", "--model", "gpt-4o", "do something"));
    expect(opts.quiet).toBe(true);
    expect(opts.model).toBe("gpt-4o");
    expect(opts.message).toBe("do something");
  });

  it("handles positional message after flags", () => {
    const opts = parseArgs(argv("what is 2+2", "-q"));
    expect(opts.quiet).toBe(true);
    expect(opts.message).toBe("what is 2+2");
  });

  it("throws on missing value for -m", () => {
    expect(() => parseArgs(argv("-m"))).toThrow("Missing value for -m");
  });

  it("throws on missing value for -c", () => {
    expect(() => parseArgs(argv("--cwd"))).toThrow("Missing value for --cwd");
  });

  it("throws on missing value for --config", () => {
    expect(() => parseArgs(argv("--config"))).toThrow(
      "Missing value for --config",
    );
  });

  it("throws on unknown option", () => {
    expect(() => parseArgs(argv("--foo"))).toThrow("Unknown option: --foo");
  });
});

describe("getHelpText", () => {
  it("includes usage line", () => {
    expect(getHelpText()).toContain("Usage: pokeshrimp");
  });

  it("lists all options", () => {
    const help = getHelpText();
    expect(help).toContain("--model");
    expect(help).toContain("--cwd");
    expect(help).toContain("--config");
    expect(help).toContain("--quiet");
    expect(help).toContain("--json");
    expect(help).toContain("--help");
    expect(help).toContain("--version");
  });
});
