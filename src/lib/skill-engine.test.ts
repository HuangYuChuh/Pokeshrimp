/**
 * Simple test runner for skill-engine — no test framework needed.
 * Run with: npx tsx src/lib/skill-engine.test.ts
 */
import { parseSkillFrontmatter, parseSkillFile } from "./skill-engine";
import path from "path";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${label}`);
  } else {
    failed++;
    console.error(`  FAIL: ${label}`);
  }
}

// --- Test parseSkillFrontmatter ---

console.log("parseSkillFrontmatter:");

const sample = `---
name: 批量去背景
description: 批量移除图片背景
command: /batch-remove-bg
requiredTools:
  - bg-remove-server
inputParams:
  - name: input_dir
    type: string
    description: 输入图片目录
  - name: output_format
    type: string
    default: png
outputs:
  - type: image/png
    description: 去背景后的透明图片
---

## 执行步骤

### Step 1: 扫描输入目录
读取 input_dir 中所有图片文件。
`;

const { frontmatter, body } = parseSkillFrontmatter(sample);

assert(frontmatter.name === "批量去背景", "parses name");
assert(frontmatter.command === "/batch-remove-bg", "parses command");
assert(
  Array.isArray(frontmatter.requiredTools) &&
    (frontmatter.requiredTools as string[])[0] === "bg-remove-server",
  "parses requiredTools array",
);
assert(
  Array.isArray(frontmatter.inputParams) &&
    (frontmatter.inputParams as Record<string, string>[])[0].name === "input_dir",
  "parses inputParams objects",
);
assert(
  Array.isArray(frontmatter.outputs) &&
    (frontmatter.outputs as Record<string, string>[])[0].type === "image/png",
  "parses outputs",
);
assert(body.includes("## 执行步骤"), "body contains steps markdown");

// --- Test parseSkillFile with real file ---

console.log("\nparseSkillFile:");

const skillPath = path.resolve(
  process.cwd(),
  ".visagent/skills/batch-remove-bg.skill.md",
);
const skill = parseSkillFile(skillPath);

assert(skill !== null, "parses real skill file");
if (skill) {
  assert(skill.name === "批量去背景", "skill.name correct");
  assert(skill.command === "/batch-remove-bg", "skill.command correct");
  assert(skill.requiredTools.length === 1, "skill.requiredTools has 1 entry");
  assert(skill.inputParams.length === 2, "skill.inputParams has 2 entries");
  assert(skill.outputs.length === 1, "skill.outputs has 1 entry");
  assert(skill.steps.includes("Step 1"), "skill.steps contains steps");
}

// --- Test no-frontmatter case ---

console.log("\nedge cases:");

const noFrontmatter = parseSkillFrontmatter("# Just markdown\nNo frontmatter.");
assert(
  Object.keys(noFrontmatter.frontmatter).length === 0,
  "no frontmatter returns empty object",
);

const invalidFile = parseSkillFile("/nonexistent/path/skill.md");
assert(invalidFile === null, "nonexistent file returns null");

// --- Summary ---

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
