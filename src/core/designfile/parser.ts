import fs from "fs";
import { parse as parseYaml } from "yaml";
import { DesignfileSchema, type Designfile } from "./types";

/**
 * Parse and validate a designfile.yaml file.
 * Returns null if the file doesn't exist or is invalid.
 */
export function parseDesignfile(filePath: string): Designfile | null {
  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = parseYaml(raw);
  } catch {
    return null;
  }

  const result = DesignfileSchema.safeParse(parsed);
  if (!result.success) {
    console.warn(`[designfile] Validation failed for ${filePath}:`, result.error.format());
    return null;
  }

  return result.data;
}
