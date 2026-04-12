import fs from "fs";
import path from "path";
import { parse as parseYaml } from "yaml";
import type { Skill, SkillInputParam, SkillOutput } from "./types";

// --- Frontmatter parser ---

interface ParsedSkillFile {
  frontmatter: Record<string, unknown>;
  body: string;
}

/**
 * Parse a SKILL.md file into YAML frontmatter fields and markdown body.
 *
 * The frontmatter is delimited by lines containing only `---`, following the
 * standard Jekyll/Hugo convention. Parsing is delegated to the `yaml` package
 * so that standard YAML features — nested objects, multiline strings,
 * comments, quoted values containing colons — all work correctly.
 */
export function parseSkillFrontmatter(raw: string): ParsedSkillFile {
  const trimmed = raw.replace(/^\uFEFF/, "").trimStart();
  if (!trimmed.startsWith("---")) {
    return { frontmatter: {}, body: trimmed };
  }

  // Match the opening fence (`---` possibly followed by whitespace + newline)
  // and the closing fence on its own line.
  const match = trimmed.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (!match) {
    return { frontmatter: {}, body: trimmed };
  }

  const yamlBlock = match[1];
  const body = trimmed.slice(match[0].length).trim();

  let parsed: unknown;
  try {
    parsed = parseYaml(yamlBlock);
  } catch {
    // Malformed YAML falls back to an empty frontmatter so that callers can
    // still surface a useful error ("missing name/command") without crashing.
    return { frontmatter: {}, body };
  }

  const frontmatter =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};

  return { frontmatter, body };
}

// --- Skill file parsing ---

function toStringOrUndefined(v: unknown): string | undefined {
  if (v === undefined || v === null) return undefined;
  return String(v);
}

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
    ? (frontmatter.requiredTools as unknown[]).filter(
        (t): t is string => typeof t === "string",
      )
    : [];

  const inputParams: SkillInputParam[] = Array.isArray(frontmatter.inputParams)
    ? (frontmatter.inputParams as unknown[])
        .filter(
          (p): p is Record<string, unknown> =>
            !!p &&
            typeof p === "object" &&
            !Array.isArray(p) &&
            typeof (p as Record<string, unknown>).name === "string",
        )
        .map((p) => ({
          name: String(p.name),
          type: String(p.type ?? "string"),
          description: toStringOrUndefined(p.description),
          default: toStringOrUndefined(p.default),
        }))
    : [];

  const outputs: SkillOutput[] = Array.isArray(frontmatter.outputs)
    ? (frontmatter.outputs as unknown[])
        .filter(
          (o): o is Record<string, unknown> =>
            !!o &&
            typeof o === "object" &&
            !Array.isArray(o) &&
            typeof (o as Record<string, unknown>).type === "string",
        )
        .map((o) => ({
          type: String(o.type),
          description: toStringOrUndefined(o.description),
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
