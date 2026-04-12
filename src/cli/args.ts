/**
 * Minimal CLI argument parser for Pokeshrimp.
 *
 * Hand-rolled to keep dependencies minimal (project philosophy).
 * Supports: -m/--model, -c/--cwd, --config, -q/--quiet, --json, -h/--help, -v/--version
 */

export interface CliOptions {
  model?: string;
  cwd?: string;
  configPath?: string;
  quiet: boolean;
  json: boolean;
  help: boolean;
  version: boolean;
  /** Positional message (one-shot mode). */
  message?: string;
}

const HELP_TEXT = `
Usage: pokeshrimp [options] [message]

AI-powered image & video creative workstation CLI.

If a message is provided (positional arg or piped via stdin),
run it as a one-shot query. Otherwise start an interactive REPL.

Options:
  -m, --model <id>     Model to use (default: from config or "claude-sonnet")
  -c, --cwd <path>     Working directory (default: current directory)
      --config <path>   Config file path override
  -q, --quiet          Suppress banner/prompts, output only agent response
      --json            Output structured JSON instead of plain text
  -h, --help           Show help
  -v, --version        Show version
`.trim();

export function getHelpText(): string {
  return HELP_TEXT;
}

export function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    quiet: false,
    json: false,
    help: false,
    version: false,
  };

  // Skip node + script path
  const args = argv.slice(2);
  const positional: string[] = [];

  let i = 0;
  while (i < args.length) {
    const arg = args[i]!;

    if (arg === "-h" || arg === "--help") {
      opts.help = true;
      i++;
    } else if (arg === "-v" || arg === "--version") {
      opts.version = true;
      i++;
    } else if (arg === "-q" || arg === "--quiet") {
      opts.quiet = true;
      i++;
    } else if (arg === "--json") {
      opts.json = true;
      i++;
    } else if (arg === "-m" || arg === "--model") {
      opts.model = args[i + 1];
      if (!opts.model) {
        throw new Error(`Missing value for ${arg}`);
      }
      i += 2;
    } else if (arg === "-c" || arg === "--cwd") {
      opts.cwd = args[i + 1];
      if (!opts.cwd) {
        throw new Error(`Missing value for ${arg}`);
      }
      i += 2;
    } else if (arg === "--config") {
      opts.configPath = args[i + 1];
      if (!opts.configPath) {
        throw new Error(`Missing value for ${arg}`);
      }
      i += 2;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
      i++;
    }
  }

  if (positional.length > 0) {
    opts.message = positional.join(" ");
  }

  return opts;
}
