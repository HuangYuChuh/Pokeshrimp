import { BrowserWindow } from "electron";

/**
 * Opens a URL in a separate BrowserWindow for browser-assisted auth.
 * The user logs in, creates an API key, copies it to clipboard,
 * then closes the window and pastes the key back in Settings.
 */
export function openExternalAuth(url: string): Promise<void> {
  return new Promise((resolve) => {
    const authWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      title: "Authenticate — Pokeshrimp",
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    authWindow.loadURL(url);

    authWindow.on("closed", () => {
      resolve();
    });
  });
}
