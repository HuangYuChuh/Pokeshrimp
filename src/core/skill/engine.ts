import fs from "fs";
import path from "path";
import type { Skill, SkillInputParam, SkillOutput } from "./types";

// --- Frontmatter parser (no external deps) ---

interface ParsedSkillFile {
  frontmatter: Record<string, unknown>;
  body: string;
}

/**
 * Parse a SKILL.md file into YAML frontmatter fields and markdown body.
 * Uses simple string splitting — no third-party YAML library needed for
 * the flat/shallow structures used in Skill definitions.
 */
export function parseSkillFrontmatter(raw: string): ParsedSkillFile {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("---")) {
    return { frontmatter: {}, body: trimmed };
  }

  const endIndex = trimmed.indexOf("\n---", 3);
  if (endIndex === -1) {
    return { frontmatter: {}, body: trimmed };
  }

  const yamlBlock = trimmed.slice(4, endIndex); // skip opening "---\n"
  const body = trimmed.slice(endIndex + 4).trim(); // skip closing "---\n"
  const frontmatter = parseSimpleYaml(yamlBlock);

  return { frontmatter, body };
}

/**
 * Minimal YAML parser that handles:
 * - scalar key: value
 * - sequence of scalars (- item)
 * - sequence of objects (- name: ...\n  type: ...)
 */
function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith("#")) {
      i++;
      continue;
    }

    const topMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (!topMatch) {
      i++;
      continue;
    }

    const key = topMatch[1];
    const inlineValue = topMatch[2].trim();

    if (!inlineValue && i + 1 < lines.length && lines[i + 1].match(/^\s+-\s/)) {
      const items: unknown[] = [];
      i++;
      while (i < lines.length && lines[i].match(/^\s+-\s/)) {
        const itemLine = lines[i];
        const itemMatch = itemLine.match(/^\s+-\s+(.*)/);
        if (!itemMatch) {
          i++;
          continue;
        }

        const itemValue = itemMatch[1].trim();
        const kvMatch = itemValue.match(/^(\w[\w-]*):\s*(.*)/);
        if (kvMatch) {
          const obj: Record<string, string> = {};
          obj[kvMatch[1]] = unquote(kvMatch[2].trim());
          i++;
          while (
            i < lines.length &&
            lines[i].match(/^\s+\w/) &&
            !lines[i].match(/^\s+-/)
          ) {
            const contMatch = lines[i]
              .trim()
              .match(/^(\w[\w-]*):\s*(.*)/);
            if (contMatch) {
              obj[contMatch[1]] = unquote(contMatch[2].trim());
            }
            i++;
          }
          items.push(obj);
        } else {
          items.push(unquote(itemValue));
          i++;
        }
      }
      result[key] = items;
    } else {
      result[key] = inlineValue ? unquote(inlineValue) : "";
      i++;
    }
  }

  return result;
}

function unquote(s: string): string {
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    return s.slice(1, -1);
  }
  return s;
}

// --- Skill file parsing ---

export function parseSkillFile(filePath: string): Skill | null {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  const { frontmatter, body } = parseSkillFrontmatter(raw);

  const name = String(frontmatter.name || "");
  const description = String(frontmatter.description || "");
  const command = String(frontmatter.command || "");

  if (!name || !command) {
    return null;
  }

  const requiredTools = Array.isArray(frontmatter.requiredTools)
    ? (frontmatter.requiredTools as string[]).map(String)
    : [];

  const inputParams: SkillInputParam[] = Array.isArray(frontmatter.inputParams)
    ? (frontmatter.inputParams as Record<string, string>[]).map((p) => ({
        name: p.name || "",
        type: p.type || "string",
        description: p.description,
        default: p.default,
      }))
    : [];

  const outputs: SkillOutput[] = Array.isArray(frontmatter.outputs)
    ? (frontmatter.outputs as Record<string, string>[]).map((o) => ({
        type: o.type || "",
        description: o.description,
      }))
    : [];

  return {
    name,
    description,
    command,
    requiredTools,
    inputParams,
    outputs,
    steps: body,
    filePath,
    scope: "project", // caller overrides for global
  };
}

// --- Skill loading (two-level scope) ---

function listSkillFiles(dir: string): string[] {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".skill.md"))
      .map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

/**
 * Load all skills from both global and project-level directories.
 * Project-level skills override global skills with the same command name.
 */
export function loadSkills(globalDir: string, projectDir: string): Skill[] {
  const skillsByCommand = new Map<string, Skill>();

  for (const file of listSkillFiles(globalDir)) {
    const skill = parseSkillFile(file);
    if (skill) {
      skill.scope = "global";
      skillsByCommand.set(skill.command, skill);
    }
  }

  for (const file of listSkillFiles(projectDir)) {
    const skill = parseSkillFile(file);
    if (skill) {
      skill.scope = "project";
      skillsByCommand.set(skill.command, skill);
    }
  }

  return Array.from(skillsByCommand.values());
}

/**
 * Find a skill by its slash command name (e.g. "/batch-remove-bg").
 */
export function getSkillByCommand(
  command: string,
  globalDir: string,
  projectDir: string,
): Skill | undefined {
  const skills = loadSkills(globalDir, projectDir);
  return skills.find((s) => s.command === command);
}

/**
 * Return all available skills as a list.
 */
export function listSkills(globalDir: string, projectDir: string): Skill[] {
  return loadSkills(globalDir, projectDir);
}
