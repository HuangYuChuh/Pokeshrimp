import { describe, it, expect } from "vitest";
import { matchCommandPattern, classifyCommand, assessRisk } from "@/core/permission/checker";

describe("matchCommandPattern", () => {
  it("exact match", () => {
    expect(matchCommandPattern("ls", "ls")).toBe(true);
  });

  it("wildcard at end", () => {
    expect(matchCommandPattern("comfyui-cli generate --w 512", "comfyui-cli *")).toBe(true);
  });

  it("wildcard mismatch", () => {
    expect(matchCommandPattern("ls", "rm *")).toBe(false);
  });

  it("multiple wildcards", () => {
    expect(matchCommandPattern("npm run build", "npm * *")).toBe(true);
  });

  it("full wildcard matches anything", () => {
    expect(matchCommandPattern("anything at all", "*")).toBe(true);
  });

  it("no wildcard requires exact match", () => {
    expect(matchCommandPattern("ls -la", "ls")).toBe(false);
  });

  it("escapes regex special characters in pattern", () => {
    expect(matchCommandPattern("cat file.txt", "cat file.txt")).toBe(true);
    expect(matchCommandPattern("cat fileTtxt", "cat file.txt")).toBe(false);
  });
});

describe("classifyCommand", () => {
  const config = {
    alwaysAllow: ["ls *", "cat *"],
    alwaysDeny: ["rm -rf *", "sudo *"],
    alwaysAsk: ["npm *"],
  };

  it("deny takes priority over allow", () => {
    expect(classifyCommand("sudo ls", config)).toBe("deny");
  });

  it("allow matches whitelisted commands", () => {
    expect(classifyCommand("ls -la", config)).toBe("allow");
  });

  it("ask matches configured patterns", () => {
    expect(classifyCommand("npm install", config)).toBe("ask");
  });

  it("unmatched commands default to ask", () => {
    expect(classifyCommand("python script.py", config)).toBe("ask");
  });

  it("deny matches dangerous patterns", () => {
    expect(classifyCommand("rm -rf /tmp/foo", config)).toBe("deny");
  });

  it("first deny pattern wins", () => {
    const cfg = {
      alwaysAllow: ["rm -rf /tmp/*"],
      alwaysDeny: ["rm -rf *"],
      alwaysAsk: [],
    };
    expect(classifyCommand("rm -rf /tmp/foo", cfg)).toBe("deny");
  });
});

describe("assessRisk", () => {
  it("rm is dangerous", () => {
    expect(assessRisk("rm file.txt")).toBe("dangerous");
  });

  it("sudo is dangerous", () => {
    expect(assessRisk("sudo apt install")).toBe("dangerous");
  });

  it("rm -rf is dangerous", () => {
    expect(assessRisk("rm -rf /tmp/foo")).toBe("dangerous");
  });

  it("ls is safe", () => {
    expect(assessRisk("ls -la")).toBe("safe");
  });

  it("cat is safe", () => {
    expect(assessRisk("cat file.txt")).toBe("safe");
  });

  it("pwd is safe", () => {
    expect(assessRisk("pwd")).toBe("safe");
  });

  it("unknown commands are moderate", () => {
    expect(assessRisk("comfyui-cli generate")).toBe("moderate");
  });

  it("dd is dangerous", () => {
    expect(assessRisk("dd if=/dev/zero of=/dev/sda")).toBe("dangerous");
  });
});
