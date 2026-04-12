import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { listSkills } from "@/lib/skill-engine";

interface ToolStatus {
  name: string;
  status: "available" | "not-installed";
  skills: string[];
}

let cache: { data: ToolStatus[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 30_000;

function checkInstalled(tool: string): boolean {
  try {
    execSync(`command -v ${tool}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json({ tools: cache.data });
  }

  const skills = listSkills();

  // Group skills by required tool
  const toolMap = new Map<string, string[]>();
  for (const skill of skills) {
    for (const tool of skill.requiredTools) {
      const existing = toolMap.get(tool) ?? [];
      existing.push(skill.command);
      toolMap.set(tool, existing);
    }
  }

  const tools: ToolStatus[] = [];
  for (const [name, skillCommands] of toolMap) {
    tools.push({
      name,
      status: checkInstalled(name) ? "available" : "not-installed",
      skills: skillCommands,
    });
  }

  cache = { data: tools, timestamp: now };
  return NextResponse.json({ tools });
}
