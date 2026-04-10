import { NextResponse } from "next/server";
import { listSkills } from "@/lib/skill-engine";

export async function GET() {
  const skills = listSkills();
  return NextResponse.json({
    skills: skills.map((s) => ({
      name: s.name,
      command: s.command,
      description: s.description,
      scope: s.scope,
    })),
  });
}
