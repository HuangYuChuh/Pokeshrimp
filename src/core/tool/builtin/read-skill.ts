import { z } from "zod";
import path from "path";
import os from "os";
import type { Tool, ToolContext, ToolResult, PermissionResult } from "../types";
import { listSkills } from "@/core/skill/engine";

const inputSchema = z.object({
  command: z
    .string()
    .describe(
      'The slash command of the skill to load (e.g. "/comfyui"). Must match a skill listed in the system prompt.',
    ),
});

/**
 * Per docs/01 §3.4: at conversation start the SkillInjectionMiddleware
 * injects only the skill name+description list into the system prompt.
 * When the agent decides it needs to use a specific skill, it calls
 * `read_skill` to load the full skill body — including required tools,
 * input parameters, and the markdown step instructions.
 *
 * This two-stage loading keeps the system prompt small even when many
 * skills are installed, and gives the agent the full instructions only
 * when actually needed.
 */
export const readSkillTool: Tool = {
  name: "read_skill",
  description:
    "Load the full instructions for a skill by its slash command. Use this when you decide to invoke a skill listed in the available skills section. Returns the skill's required tools, input parameters, and step-by-step instructions.",
  inputSchema,
  isBuiltin: true,

  isReadOnly() {
    return true;
  },

  isConcurrencySafe() {
    return true;
  },

  async checkPermissions(): Promise<PermissionResult> {
    return { behavior: "allow" };
  },

  async call(input: unknown, context: ToolContext): Promise<ToolResult> {
    const { command } = input as z.infer<typeof inputSchema>;

    const globalDir = path.join(os.homedir(), ".visagent", "skills");
    const projectDir = path.join(context.cwd, ".visagent", "skills");
    const skills = listSkills(globalDir, projectDir);

    const normalized = command.startsWith("/") ? command : `/${command}`;
    const skill = skills.find((s) => s.command === normalized);
    if (!skill) {
      const available = skills.map((s) => s.command).join(", ");
      return {
        success: false,
        data: null,
        error: `Skill "${normalized}" not found. Available skills: ${available || "(none installed)"}`,
      };
    }

    const sections: string[] = [`# ${skill.name} (${skill.command})`, skill.description];

    if (skill.requiredTools.length > 0) {
      sections.push(`## Required Tools\n${skill.requiredTools.map((t) => `- ${t}`).join("\n")}`);
    }

    if (skill.inputParams.length > 0) {
      const lines = skill.inputParams.map((p) => {
        const desc = p.description ? ` — ${p.description}` : "";
        const def = p.default ? ` (default: \`${p.default}\`)` : "";
        return `- **${p.name}** (${p.type})${def}${desc}`;
      });
      sections.push(`## Parameters\n${lines.join("\n")}`);
    }

    if (skill.outputs.length > 0) {
      const lines = skill.outputs.map((o) => {
        const desc = o.description ? ` — ${o.description}` : "";
        return `- **${o.type}**${desc}`;
      });
      sections.push(`## Outputs\n${lines.join("\n")}`);
    }

    sections.push(`## Steps\n${skill.steps}`);

    return {
      success: true,
      data: {
        command: skill.command,
        scope: skill.scope,
        body: sections.join("\n\n"),
      },
    };
  },
};
