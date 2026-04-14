import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, rmSync, readFileSync, realpathSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { runCreateSkill } from "@/cli/create-skill";

describe("runCreateSkill", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = realpathSync(mkdtempSync(join(tmpdir(), "pokeshrimp-create-skill-test-")));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates a skill file with default name", () => {
    const filePath = runCreateSkill(undefined, tempDir);

    expect(filePath).toBe(join(tempDir, ".visagent", "skills", "my-skill.skill.md"));
    expect(existsSync(filePath)).toBe(true);
  });

  it("creates .visagent/skills/ directory if it does not exist", () => {
    runCreateSkill("test-tool", tempDir);

    expect(existsSync(join(tempDir, ".visagent", "skills"))).toBe(true);
  });

  it("creates a file with the given name", () => {
    const filePath = runCreateSkill("image-gen", tempDir);

    expect(filePath).toBe(join(tempDir, ".visagent", "skills", "image-gen.skill.md"));
    expect(existsSync(filePath)).toBe(true);
  });

  it("substitutes kebab-case name into command field", () => {
    runCreateSkill("batch-resize", tempDir);

    const content = readFileSync(
      join(tempDir, ".visagent", "skills", "batch-resize.skill.md"),
      "utf-8",
    );
    expect(content).toContain("command: /batch-resize");
  });

  it("substitutes Title Case name into name field", () => {
    runCreateSkill("batch-resize", tempDir);

    const content = readFileSync(
      join(tempDir, ".visagent", "skills", "batch-resize.skill.md"),
      "utf-8",
    );
    expect(content).toContain("name: Batch Resize");
  });

  it("includes valid YAML frontmatter", () => {
    runCreateSkill("my-tool", tempDir);

    const content = readFileSync(join(tempDir, ".visagent", "skills", "my-tool.skill.md"), "utf-8");
    expect(content.startsWith("---\n")).toBe(true);
    expect(content).toContain("requiredTools:");
    expect(content).toContain("inputParams:");
    expect(content).toContain("outputs:");
  });

  it("includes body with usage instructions", () => {
    runCreateSkill("my-tool", tempDir);

    const content = readFileSync(join(tempDir, ".visagent", "skills", "my-tool.skill.md"), "utf-8");
    expect(content).toContain("## Usage");
    expect(content).toContain("{{input}}");
    expect(content).toContain("## Notes");
  });

  it("throws if file already exists", () => {
    const skillsDir = join(tempDir, ".visagent", "skills");
    mkdirSync(skillsDir, { recursive: true });
    writeFileSync(join(skillsDir, "existing.skill.md"), "existing content");

    expect(() => runCreateSkill("existing", tempDir)).toThrow("already exists");
  });

  it("does not overwrite existing file content", () => {
    const skillsDir = join(tempDir, ".visagent", "skills");
    mkdirSync(skillsDir, { recursive: true });
    const filePath = join(skillsDir, "existing.skill.md");
    writeFileSync(filePath, "original content");

    expect(() => runCreateSkill("existing", tempDir)).toThrow();

    const content = readFileSync(filePath, "utf-8");
    expect(content).toBe("original content");
  });

  it("returns the absolute file path", () => {
    const filePath = runCreateSkill("cool-tool", tempDir);

    expect(filePath).toMatch(/^\//);
    expect(filePath).toContain("cool-tool.skill.md");
  });
});
