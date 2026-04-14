/**
 * `pokeshrimp init` — scaffold a new .visagent/ project directory.
 *
 * Creates the standard directory structure with sensible defaults.
 * Refuses to overwrite an existing .visagent/ directory.
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";

/** Default config.json content. */
const DEFAULT_CONFIG = {
  defaultModel: "claude-sonnet",
  permissions: {
    alwaysAllow: [],
    alwaysDeny: ["rm -rf *", "sudo *"],
    alwaysAsk: [],
  },
};

/** Minimal designfile.yaml template. */
const DEFAULT_DESIGNFILE = `brand: My Project
assets: {}
`;

/** Example skill README to guide users. */
const SKILLS_README = `# Skills

Place \`.skill.md\` files here to teach the agent new CLI tools.

Each skill file describes a tool's CLI interface so the agent can
invoke it without any code changes. See the Pokeshrimp docs for
the canonical .skill.md format.
`;

export interface InitOptions {
  /** Target directory (defaults to cwd). */
  targetDir?: string;
}

export interface InitResult {
  /** Absolute path of the created .visagent directory. */
  visagentDir: string;
  /** List of created file/directory paths (relative to targetDir). */
  created: string[];
}

/**
 * Run the init scaffolding.
 *
 * @returns Result describing what was created.
 * @throws If .visagent/ already exists in the target directory.
 */
export function runInit(options: InitOptions = {}): InitResult {
  const targetDir = resolve(options.targetDir ?? process.cwd());
  const visagentDir = join(targetDir, ".visagent");

  if (existsSync(visagentDir)) {
    throw new Error(`.visagent/ already exists in ${targetDir}. Aborting to avoid overwriting.`);
  }

  const created: string[] = [];

  // Create directories
  mkdirSync(visagentDir, { recursive: true });
  created.push(".visagent/");

  const skillsDir = join(visagentDir, "skills");
  mkdirSync(skillsDir, { recursive: true });
  created.push(".visagent/skills/");

  const hooksDir = join(visagentDir, "hooks");
  mkdirSync(hooksDir, { recursive: true });
  created.push(".visagent/hooks/");

  // Write config.json
  const configPath = join(visagentDir, "config.json");
  writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n");
  created.push(".visagent/config.json");

  // Write designfile.yaml
  const designfilePath = join(visagentDir, "designfile.yaml");
  writeFileSync(designfilePath, DEFAULT_DESIGNFILE);
  created.push(".visagent/designfile.yaml");

  // Write skills README
  const skillsReadmePath = join(skillsDir, "README.md");
  writeFileSync(skillsReadmePath, SKILLS_README);
  created.push(".visagent/skills/README.md");

  return { visagentDir, created };
}

/**
 * CLI entry point for `pokeshrimp init`.
 * Handles output and process exit.
 */
export function handleInit(projectName?: string, cwd?: string): void {
  // If project name given, create a subdirectory
  let targetDir: string;
  if (projectName) {
    targetDir = resolve(cwd ?? process.cwd(), projectName);
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }
  } else {
    targetDir = resolve(cwd ?? process.cwd());
  }

  try {
    const result = runInit({ targetDir });

    console.log(`Initialized Pokeshrimp project in ${targetDir}\n`);
    console.log("Created:");
    for (const entry of result.created) {
      console.log(`  ${entry}`);
    }
    console.log("\nEdit .visagent/config.json to configure your API keys and model.");
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
