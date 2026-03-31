import type { Skill } from "./types";

/**
 * Build an enhanced prompt from a Skill definition and user-provided params.
 */
export function buildSkillPrompt(
  skill: Skill,
  params: Record<string, string>,
): string {
  const sections: string[] = [];

  sections.push(`# Skill: ${skill.name}`);
  if (skill.description) {
    sections.push(skill.description);
  }

  if (skill.requiredTools.length > 0) {
    sections.push(
      `## Required Tools\n${skill.requiredTools.map((t) => `- ${t}`).join("\n")}`,
    );
  }

  if (skill.inputParams.length > 0) {
    const paramLines = skill.inputParams.map((p) => {
      const value = params[p.name] ?? p.default ?? "(not provided)";
      const desc = p.description ? ` — ${p.description}` : "";
      return `- **${p.name}** (${p.type}): ${value}${desc}`;
    });
    sections.push(`## Parameters\n${paramLines.join("\n")}`);
  }

  // Replace {{param}} placeholders in steps
  let steps = skill.steps;
  for (const [key, value] of Object.entries(params)) {
    steps = steps.replaceAll(`{{${key}}}`, value);
  }
  // Fill defaults for unreplaced placeholders
  for (const p of skill.inputParams) {
    if (p.default) {
      steps = steps.replaceAll(`{{${p.name}}}`, p.default);
    }
  }

  sections.push(`## Steps\n${steps}`);

  return sections.join("\n\n");
}
