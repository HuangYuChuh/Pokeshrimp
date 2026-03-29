import { contextBridge } from "electron";

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld("pokeshrimp", {
  platform: process.platform,
});
