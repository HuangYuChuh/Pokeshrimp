import fs from "fs";
import path from "path";
import os from "os";
import { AppConfigSchema, type AppConfig } from "./schema";

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    const tgtVal = result[key];
    if (
      srcVal !== null &&
      typeof srcVal === "object" &&
      !Array.isArray(srcVal) &&
      tgtVal !== null &&
      typeof tgtVal === "object" &&
      !Array.isArray(tgtVal)
    ) {
      result[key] = deepMerge(
        tgtVal as Record<string, unknown>,
        srcVal as Record<string, unknown>,
      );
    } else {
      result[key] = srcVal;
    }
  }
  return result;
}

export function loadConfigFile(filePath: string): Partial<AppConfig> {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);
    const parsed = AppConfigSchema.partial().safeParse(json);
    if (parsed.success) {
      return parsed.data as Partial<AppConfig>;
    }
    return {};
  } catch {
    return {};
  }
}

export function loadConfig(cwd?: string): AppConfig {
  const workDir = cwd ?? process.cwd();

  const globalConfig = loadConfigFile(
    path.join(os.homedir(), ".visagent", "config.json"),
  );
  const projectConfig = loadConfigFile(
    path.join(workDir, ".visagent", "config.json"),
  );
  const localConfig = loadConfigFile(
    path.join(workDir, ".visagent", "config.local.json"),
  );

  const merged = deepMerge(
    deepMerge(
      globalConfig as Record<string, unknown>,
      projectConfig as Record<string, unknown>,
    ),
    localConfig as Record<string, unknown>,
  );

  return AppConfigSchema.parse(merged);
}

let cached: AppConfig | null = null;

export function getConfig(cwd?: string): AppConfig {
  if (!cached) {
    cached = loadConfig(cwd);
  }
  return cached;
}

export function reloadConfig(cwd?: string): AppConfig {
  cached = null;
  return getConfig(cwd);
}
