// Re-export from core — keeps existing imports working
import os from "os";
import path from "path";
import {
  loadSkills as coreLoadSkills,
  getSkillByCommand as coreGetSkillByCommand,
  listSkills as coreListSkills,
} from "@/core/skill/engine";

export type { Skill, SkillInputParam, SkillOutput } from "@/core/skill/types";
export { parseSkillFrontmatter, parseSkillFile } from "@/core/skill/engine";

function getSkillDirs(cwd?: string): { globalDir: string; projectDir: string } {
  const projectDir = cwd || process.cwd();
  return {
    globalDir: path.join(os.homedir(), ".visagent", "skills"),
    projectDir: path.join(projectDir, ".visagent", "skills"),
  };
}

export function loadSkills(cwd?: string) {
  const { globalDir, projectDir } = getSkillDirs(cwd);
  return coreLoadSkills(globalDir, projectDir);
}

export function getSkillByCommand(command: string, cwd?: string) {
  const { globalDir, projectDir } = getSkillDirs(cwd);
  return coreGetSkillByCommand(command, globalDir, projectDir);
}

export function listSkills(cwd?: string) {
  const { globalDir, projectDir } = getSkillDirs(cwd);
  return coreListSkills(globalDir, projectDir);
}
