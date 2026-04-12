import path from "path";
import os from "os";
import { listSkills } from "./engine";
import type { Skill } from "./types";

// --- Pipeline types ---

export interface PipelineStep {
  /** Slash command, e.g. "/remove-bg" */
  skill: string;
  /** Override params for this step */
  params?: Record<string, string>;
}

export interface PipelineStepPlan {
  index: number;
  skill: string;
  skillName: string;
  params: Record<string, string>;
  requiredTools: string[];
  /** Markdown body (execution steps) from the skill */
  steps: string;
}

export interface PipelineValidationWarning {
  step: number;
  skill: string;
  message: string;
}

export interface PipelinePlan {
  steps: PipelineStepPlan[];
  warnings: PipelineValidationWarning[];
}

// --- Pipeline builder ---

/**
 * Validate a list of pipeline steps and produce an execution plan.
 *
 * The plan itself does NOT execute anything — the Agent reads it and
 * runs each step using `read_skill` + `run_command` in the standard
 * tool flow. This keeps the pipeline tool read-only and lets the
 * Agent maintain control over execution (consistent with the
 * designfile approach where `rebuild_asset` returns a plan).
 *
 * Parameter substitution: any param value containing
 * `{{previous_output}}` is flagged in the plan so the Agent knows to
 * replace it with the actual output path from the prior step at
 * execution time.
 */
export function buildPipelinePlan(
  pipelineSteps: PipelineStep[],
  cwd: string,
): { plan: PipelinePlan | null; error?: string } {
  if (pipelineSteps.length === 0) {
    return { plan: null, error: "Pipeline must contain at least one step." };
  }

  const globalDir = path.join(os.homedir(), ".visagent", "skills");
  const projectDir = path.join(cwd, ".visagent", "skills");
  const skills = listSkills(globalDir, projectDir);
  const skillMap = new Map<string, Skill>();
  for (const s of skills) {
    skillMap.set(s.command, s);
  }

  const resolvedSteps: PipelineStepPlan[] = [];
  const warnings: PipelineValidationWarning[] = [];

  // Check for duplicate consecutive skills (likely a mistake)
  const seen = new Set<string>();

  for (let i = 0; i < pipelineSteps.length; i++) {
    const step = pipelineSteps[i];
    const command = step.skill.startsWith("/") ? step.skill : `/${step.skill}`;
    const skill = skillMap.get(command);

    if (!skill) {
      const available = skills.map((s) => s.command).join(", ");
      return {
        plan: null,
        error: `Step ${i + 1}: skill "${command}" not found. Available: ${available || "(none installed)"}`,
      };
    }

    // Warn on duplicate skills in the same pipeline
    if (seen.has(command)) {
      warnings.push({
        step: i + 1,
        skill: command,
        message: `Skill "${command}" appears multiple times in the pipeline.`,
      });
    }
    seen.add(command);

    // Warn if requiredTools might not be available
    if (skill.requiredTools.length > 0) {
      warnings.push({
        step: i + 1,
        skill: command,
        message: `Requires CLI tools: ${skill.requiredTools.join(", ")}. Ensure they are installed.`,
      });
    }

    // Merge default params with overrides
    const params: Record<string, string> = {};
    for (const p of skill.inputParams) {
      if (p.default !== undefined) {
        params[p.name] = p.default;
      }
    }
    if (step.params) {
      for (const [k, v] of Object.entries(step.params)) {
        params[k] = v;
      }
    }

    resolvedSteps.push({
      index: i + 1,
      skill: command,
      skillName: skill.name,
      params,
      requiredTools: skill.requiredTools,
      steps: skill.steps,
    });
  }

  return {
    plan: { steps: resolvedSteps, warnings },
  };
}
