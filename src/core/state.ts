import type { AppConfig } from "./config/schema";

export interface AppState {
  config: AppConfig;
  initialized: boolean;
}

let state: AppState | null = null;

export function initAppState(config: AppConfig): AppState {
  state = { config, initialized: true };
  return state;
}

export function getAppState(): AppState {
  if (!state) {
    throw new Error("App state not initialized. Call initAppState() first.");
  }
  return state;
}
