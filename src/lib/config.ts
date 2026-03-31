// Re-export from core — keeps existing imports working
export { getConfig, reloadConfig, loadConfig, loadConfigFile } from "@/core/config/loader";
export type { AppConfig } from "@/core/config/schema";

// Legacy type alias for backward compatibility
export type PokeshrimpConfig = import("@/core/config/schema").AppConfig;

// Legacy saveConfig — writes to global config file
import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".pokeshrimp");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function saveConfig(config: Record<string, unknown>): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}
