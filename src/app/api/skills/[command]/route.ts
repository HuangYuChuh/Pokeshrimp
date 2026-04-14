import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { listSkills } from "@/lib/skill-engine";

export async function DELETE(_req: Request, { params }: { params: Promise<{ command: string }> }) {
  const { command } = await params;

  const skills = listSkills();
  const skill = skills.find((s) => s.command === command);

  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  if (skill.scope !== "project") {
    return NextResponse.json(
      { error: "Only project-level skills can be deleted" },
      { status: 403 },
    );
  }

  const skillsDir = path.join(process.cwd(), ".visagent", "skills");
  const filename = path.basename(skill.filePath);
  const fullPath = path.join(skillsDir, filename);

  // Ensure the resolved path is within the skills directory (path traversal guard)
  if (!fullPath.startsWith(skillsDir)) {
    return NextResponse.json({ error: "Invalid skill path" }, { status: 400 });
  }

  try {
    fs.unlinkSync(fullPath);
  } catch {
    return NextResponse.json({ error: "Failed to delete skill file" }, { status: 500 });
  }

  return NextResponse.json({ deleted: command });
}
