import { app, BrowserWindow } from "electron";
import { fork, ChildProcess } from "child_process";
import path from "path";

let mainWindow: BrowserWindow | null = null;
let nextServer: ChildProcess | null = null;

const isDev = !app.isPackaged;
const NEXT_PORT = 3099;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    title: "Pokeshrimp",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://localhost:${NEXT_PORT}`);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function startNextServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // Dev mode: assume `next dev` is running separately
      resolve();
      return;
    }

    // Production: fork the Next.js standalone server
    const serverPath = path.join(
      app.getAppPath(),
      ".next",
      "standalone",
      "server.js"
    );

    nextServer = fork(serverPath, [], {
      env: { ...process.env, PORT: String(NEXT_PORT) },
      stdio: "pipe",
    });

    nextServer.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString();
      console.log("[Next.js]", msg);
      if (msg.includes("Ready") || msg.includes("started")) {
        resolve();
      }
    });

    nextServer.stderr?.on("data", (data: Buffer) => {
      console.error("[Next.js Error]", data.toString());
    });

    nextServer.on("error", reject);

    // Fallback: resolve after 3 seconds
    setTimeout(resolve, 3000);
  });
}

app.whenReady().then(async () => {
  await startNextServer();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nextServer) {
    nextServer.kill();
  }
});
