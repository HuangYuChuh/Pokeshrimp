import fs from "fs";
import path from "path";
import os from "os";

export interface PokeshrimpConfig {
  defaultModel?: string;
  apiKeys?: {
    anthropic?: string;
    openai?: string;
  };
}

const CONFIG_DIR = path.join(os.homedir(), ".pokeshrimp");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export function getConfig(): PokeshrimpConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // Fall back to empty config
  }
  return {};
}

export function saveConfig(config: PokeshrimpConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}
