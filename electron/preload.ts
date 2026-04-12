import { contextBridge, ipcRenderer } from "electron";

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld("pokeshrimp", {
  platform: process.platform,
  auth: {
    openBrowser: (url: string) => ipcRenderer.invoke("auth:open-browser", url),
  },
});
