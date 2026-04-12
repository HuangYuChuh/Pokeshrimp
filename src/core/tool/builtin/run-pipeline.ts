import { z } from "zod";
import type { Tool, ToolContext, ToolResult, PermissionResult } from "../types";
import { buildPipelinePlan } from "@/core/skill/pipeline";

const stepSchema = z.object({
  skill: z
    .string()
    .describe('Slash command for the skill, e.g. "/remove-bg"'),
  params: z
    .record(z.string())
    .optional()
    .describe(
      'Override params for this step. Use "{{previous_output}}" as a value to reference the prior step\'s output file path.',
    ),
});

const inputSchema = z.object({
  steps: z
    .array(stepSchema)
    .min(1)
    .describe(
      "Ordered list of skill steps to chain. Each step's output feeds into the next step's input.",
    ),
});

/**
 * Returns an execution plan for a linear skill pipeline.
 *
 * Does NOT execute the skills — the Agent reads the plan and runs
 * each step itself using `read_skill` + `run_command`. This keeps
 * the tool read-only and lets the Agent maintain orchestration
 * control, consistent with the designfile `rebuild_asset` pattern.
 */
export const runPipelineTool: Tool = {
  name: "run_skill_pipeline",
  description:
    "Validate a sequence of skills and return an execution plan for chaining them together. Each step is a skill slash command with optional parameter overrides. The plan includes resolved parameters, required CLI tools, and step instructions. You should then execute each step in order, passing the output of each step as input to the next.",
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
    const { steps } = input as z.infer<typeof inputSchema>;

    const { plan, error } = buildPipelinePlan(steps, context.cwd);

    if (!plan) {
      return { success: false, data: null, error };
    }

    // Format the plan as a readable summary for the Agent
    const summary = plan.steps
      .map(
        (s) =>
          `Step ${s.index}: ${s.skillName} (${s.skill})` +
          (Object.keys(s.params).length > 0
            ? `\n  Params: ${JSON.stringify(s.params)}`
            : "") +
          (s.requiredTools.length > 0
            ? `\n  Requires: ${s.requiredTools.join(", ")}`
            : ""),
      )
      .join("\n");

    const warningText =
      plan.warnings.length > 0
        ? `\n\nWarnings:\n${plan.warnings.map((w) => `- Step ${w.step} (${w.skill}): ${w.message}`).join("\n")}`
        : "";

    return {
      success: true,
      data: {
        plan: plan.steps,
        warnings: plan.warnings,
        summary: `Pipeline with ${plan.steps.length} step(s):\n${summary}${warningText}\n\nExecute each step in order. For steps after the first, pass the previous step's output file as the input file parameter.`,
      },
    };
  },
};
