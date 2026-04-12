import fs from "fs";
import path from "path";
import { app } from "electron";

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

type TokenFileData = Record<string, TokenSet>;

function getTokenFilePath(): string {
  const home = app.getPath("home");
  return path.join(home, ".visagent", "oauth-tokens.json");
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readTokenFile(): TokenFileData {
  const filePath = getTokenFilePath();
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as TokenFileData;
  } catch {
    return {};
  }
}

function writeTokenFile(data: TokenFileData): void {
  const filePath = getTokenFilePath();
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), {
    encoding: "utf-8",
    mode: 0o600,
  });
}

export function saveTokens(provider: string, tokens: TokenSet): void {
  const data = readTokenFile();
  data[provider] = tokens;
  writeTokenFile(data);
}

export function loadTokens(provider: string): TokenSet | null {
  const data = readTokenFile();
  return data[provider] ?? null;
}

export function clearTokens(provider: string): void {
  const data = readTokenFile();
  delete data[provider];
  writeTokenFile(data);
}
