export interface SkillInputParam {
  name: string;
  type: string;
  description?: string;
  default?: string;
}

export interface SkillOutput {
  type: string;
  description?: string;
}

export interface Skill {
  name: string;
  description: string;
  command: string;
  requiredTools: string[];
  inputParams: SkillInputParam[];
  outputs: SkillOutput[];
  /** Raw markdown body (execution steps) below the frontmatter */
  steps: string;
  /** Absolute path to the source .skill.md file */
  filePath: string;
  /** "global" | "project" */
  scope: "global" | "project";
}
