/**
 * `pokeshrimp create-skill` — scaffold a new .skill.md file.
 *
 * Creates a template skill file in `.visagent/skills/` with sensible
 * defaults. Refuses to overwrite an existing file.
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";

/**
 * Convert a kebab-case name to Title Case.
 * "my-skill" -> "My Skill"
 */
function toTitleCase(kebab: string): string {
  return kebab
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generate the template content for a skill file.
 */
function getTemplate(kebabName: string): string {
  const titleName = toTitleCase(kebabName);

  return `---
name: ${titleName}
command: /${kebabName}
description: Describe what this skill does
requiredCLI: tool-name
requiredTools:
  - run_command
inputParams:
  - name: input
    type: string
    description: The input file or prompt
outputs:
  - type: image
    description: The generated output
---

## Usage

tool-name <command> --input {{input}} --output ./output.png

## Parameters

- \`--input\`: The input file or prompt text

## Notes

- Ensure \`tool-name\` is installed and available in PATH
`;
}

/**
 * Run the create-skill scaffolding.
 *
 * @param name - Skill name in kebab-case (default: "my-skill")
 * @param cwd - Working directory (default: process.cwd())
 * @returns Absolute path of the created file.
 * @throws If the file already exists.
 */
export function runCreateSkill(name?: string, cwd?: string): string {
  const skillName = name || "my-skill";
  const targetDir = resolve(cwd ?? process.cwd());
  const skillsDir = join(targetDir, ".visagent", "skills");
  const filePath = join(skillsDir, `${skillName}.skill.md`);

  if (existsSync(filePath)) {
    throw new Error(`${filePath} already exists. Aborting to avoid overwriting.`);
  }

  mkdirSync(skillsDir, { recursive: true });
  writeFileSync(filePath, getTemplate(skillName));

  return filePath;
}

/**
 * CLI entry point for `pokeshrimp create-skill`.
 * Handles output and process exit.
 */
export function handleCreateSkill(name?: string, cwd?: string): void {
  try {
    const filePath = runCreateSkill(name, cwd);
    console.log(`Created skill file: ${filePath}`);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}
