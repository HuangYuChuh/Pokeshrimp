import { app, BrowserWindow, nativeTheme } from "electron";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import http from "http";

let mainWindow: BrowserWindow | null = null;
let nextServer: ChildProcess | null = null;

const isDev = !app.isPackaged;
const isMac = process.platform === "darwin";
const NEXT_PORT = 3099;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    show: false,
    title: "Pokeshrimp",
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#09090b" : "#ffffff",
    ...(isMac
      ? {
          titleBarStyle: "hidden",
          trafficLightPosition: { x: 12, y: 16 },
        }
      : {
          frame: false,
        }),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://localhost:${NEXT_PORT}`);

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function waitForServer(
  port: number,
  timeoutMs: number = 30000
): Promise<void> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Next.js did not start within ${timeoutMs}ms`));
          return;
        }
        setTimeout(check, 300);
      });
      req.end();
    };
    check();
  });
}

function startNextServer(): Promise<void> {
  if (isDev) {
    const projectRoot = path.join(__dirname, "..");
    nextServer = spawn("npx", ["next", "dev", "--port", String(NEXT_PORT)], {
      cwd: projectRoot,
      env: { ...process.env },
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });

    nextServer.stdout?.on("data", (data: Buffer) => {
      console.log("[Next.js]", data.toString().trim());
    });

    nextServer.stderr?.on("data", (data: Buffer) => {
      console.error("[Next.js]", data.toString().trim());
    });

    nextServer.on("error", (err) => {
      console.error("[Next.js] Failed to start:", err);
    });

    return waitForServer(NEXT_PORT);
  }

  const serverPath = path.join(
    app.getAppPath(),
    ".next",
    "standalone",
    "server.js"
  );

  nextServer = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: String(NEXT_PORT), HOSTNAME: "localhost" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  nextServer.stdout?.on("data", (data: Buffer) => {
    console.log("[Next.js]", data.toString().trim());
  });

  nextServer.stderr?.on("data", (data: Buffer) => {
    console.error("[Next.js]", data.toString().trim());
  });

  nextServer.on("error", (err) => {
    console.error("[Next.js] Failed to start:", err);
  });

  return waitForServer(NEXT_PORT);
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
  if (nextServer && !nextServer.killed) {
    nextServer.kill();
  }
});
