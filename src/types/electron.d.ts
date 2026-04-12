/**
 * Type declarations for APIs exposed by Electron's preload script
 * via contextBridge.exposeInMainWorld("pokeshrimp", ...).
 */

interface PokeshrimpBridge {
  platform: string;
  auth?: {
    openBrowser?: (url: string) => Promise<void>;
    openaiOAuth?: () => Promise<{ accessToken: string }>;
  };
}

interface Window {
  pokeshrimp?: PokeshrimpBridge;
}
