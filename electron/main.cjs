// ─────────────────────────────────────────────────────────────────────────────
// DANK STUDIO — Electron Main Process
// Wraps the Vite React app as a Windows .exe via electron-builder.
// Dev:   npm run electron:dev   → starts Vite then opens Electron
// Build: npm run electron:build → produces installer in dist-electron/
// ─────────────────────────────────────────────────────────────────────────────
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const { existsSync } = require("fs");

// Suppress GPU sandbox warning on some Windows setups
app.commandLine.appendSwitch("no-sandbox");

const isDev = !app.isPackaged;
const VITE_DEV_URL = "http://localhost:5174";

function createWindow() {
  const win = new BrowserWindow({
    width:  1440,
    height: 900,
    minWidth:  900,
    minHeight: 600,
    title: "Dank Studio",
    backgroundColor: "#09090b",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // No preload needed — pure web app
    },
    // Remove default menu bar
    autoHideMenuBar: true,
  });

  if (isDev) {
    win.loadURL(VITE_DEV_URL);
    // Open DevTools in dev
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    // Load the built index.html (relative path because vite.config base: './')
    const indexPath = path.join(__dirname, "..", "dist", "index.html");
    if (existsSync(indexPath)) {
      win.loadFile(indexPath);
    } else {
      win.loadURL(`file://${indexPath}`);
    }
  }

  // Open external links in the browser, not Electron
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();

  // macOS: re-create window on dock click
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
