import { z } from "zod";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parseSkillFrontmatter } from "@/core/skill/engine";

const ImportSkillSchema = z.object({
  filename: z.string().min(1).refine((f) => f.endsWith(".skill.md"), {
    message: "File must end with .skill.md",
  }),
  content: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = ImportSkillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { filename, content } = parsed.data;

  // Validate the skill file has required frontmatter fields
  const { frontmatter } = parseSkillFrontmatter(content);
  const name = frontmatter.name ? String(frontmatter.name) : "";
  const command = frontmatter.command ? String(frontmatter.command) : "";

  if (!name || !command) {
    return NextResponse.json(
      { error: "Invalid skill file: missing required 'name' or 'command' in frontmatter" },
      { status: 400 },
    );
  }

  // Write to project-level skills directory
  const skillsDir = path.join(process.cwd(), ".visagent", "skills");
  fs.mkdirSync(skillsDir, { recursive: true });

  const dest = path.join(skillsDir, path.basename(filename));
  fs.writeFileSync(dest, content, "utf-8");

  return NextResponse.json({ name, command, path: dest }, { status: 201 });
}
