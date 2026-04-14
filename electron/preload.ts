import { contextBridge, ipcRenderer } from "electron";

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld("pokeshrimp", {
  platform: process.platform,
  auth: {
    openBrowser: (url: string) => ipcRenderer.invoke("auth:open-browser", url),
    openaiOAuth: (): Promise<{ accessToken: string }> => ipcRenderer.invoke("auth:openai-oauth"),
    getValidToken: (): Promise<string | null> => ipcRenderer.invoke("auth:get-valid-token"),
  },
});
