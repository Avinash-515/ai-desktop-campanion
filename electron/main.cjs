const { app, BrowserWindow, ipcMain, shell, dialog, Notification } = require("electron");
const path = require("path");
const os = require("os");
const fs = require("fs");
const { exec } = require("child_process");

let mainWindow;
let overlayWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: "#070b14",
    title: "AI Desktop Companion",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173").catch(() => {
      const distIndex = path.join(__dirname, "../dist/index.html");
      if (fs.existsSync(distIndex)) {
        mainWindow.loadFile(distIndex);
      }
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

function createOverlayWindow() {
  if (overlayWindow && !overlayWindow.isDestroyed()) return;

  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = primaryDisplay.workAreaSize;

  const overlayW = 460;
  const overlayH = 560;
  const x = Math.max(0, screenW - overlayW - 20);
  const y = Math.max(0, screenH - overlayH - 10);

  overlayWindow = new BrowserWindow({
    width: overlayW,
    height: overlayH,
    x,
    y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    backgroundColor: "#00000000",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  overlayWindow.setAlwaysOnTop(true, "screen-saver");

  const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
  if (isDev) {
    overlayWindow.loadURL("http://localhost:5173?mode=overlay").catch(() => {
      const distIndex = path.join(__dirname, "../dist/index.html");
      if (fs.existsSync(distIndex)) {
        overlayWindow.loadFile(distIndex, {
          query: { mode: "overlay" }
        });
      }
    });
  } else {
    overlayWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      query: { mode: "overlay" }
    });
  }

  overlayWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      overlayWindow.hide();
    }
  });
}

// -------------------------------------------------------------
// IPC Handlers
// -------------------------------------------------------------

// 1. App Info
ipcMain.handle("app:get-info", () => {
  return {
    name: "AI Desktop Companion",
    platform: process.platform,
    version: app.getVersion(),
    arch: process.arch,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    uptime: Math.round(process.uptime()),
    homedir: os.homedir(),
    hostname: os.hostname()
  };
});

// 2. Real System Stats
ipcMain.handle("system:get-stats", () => {
  const cpus = os.cpus() || [];
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPercent = Math.round((usedMem / totalMem) * 100);

  return {
    cpuModel: cpus.length > 0 ? cpus[0].model : "Standard Processor",
    cpuCount: cpus.length,
    cpuSpeed: cpus.length > 0 ? cpus[0].speed : 0,
    totalMemGB: (totalMem / (1024 ** 3)).toFixed(1),
    freeMemGB: (freeMem / (1024 ** 3)).toFixed(1),
    usedMemGB: (usedMem / (1024 ** 3)).toFixed(1),
    memPercent,
    platform: process.platform,
    release: os.release(),
    arch: os.arch(),
    hostname: os.hostname(),
    uptimeSeconds: os.uptime(),
    homeDir: os.homedir()
  };
});

// 3. Application Launcher
ipcMain.handle("app:launch", async (_, target) => {
  if (!target || typeof target !== "string") {
    return { success: false, message: "Invalid target provided" };
  }

  const query = target.trim().toLowerCase();
  const isWindows = process.platform === "win32";
  const isMac = process.platform === "darwin";

  let commandToRun = null;

  if (query === "code" || query === "vscode" || query === "visual studio code") {
    commandToRun = isWindows ? "code" : "open -a 'Visual Studio Code' || code";
  } else if (query === "terminal" || query === "powershell" || query === "cmd") {
    commandToRun = isWindows ? "start powershell" : isMac ? "open -a Terminal" : "x-terminal-emulator";
  } else if (query === "wt" || query === "windows terminal") {
    commandToRun = "start wt";
  } else if (query === "explorer" || query === "files" || query === "file explorer") {
    commandToRun = isWindows ? "explorer" : isMac ? "open ." : "xdg-open .";
  } else if (query === "calc" || query === "calculator") {
    commandToRun = isWindows ? "calc" : isMac ? "open -a Calculator" : "gnome-calculator";
  } else if (query === "notepad" || query === "text editor" || query === "notes") {
    commandToRun = isWindows ? "notepad" : isMac ? "open -a TextEdit" : "gedit";
  } else if (query === "taskmgr" || query === "task manager") {
    commandToRun = isWindows ? "start taskmgr" : isMac ? "open -a 'Activity Monitor'" : "gnome-system-monitor";
  } else if (query === "settings") {
    commandToRun = isWindows ? "start ms-settings:" : isMac ? "open 'x-apple.systempreferences:'" : "gnome-control-center";
  } else if (query === "browser" || query === "chrome" || query === "edge") {
    if (query === "chrome") {
      commandToRun = isWindows ? "start chrome" : "open -a 'Google Chrome'";
    } else if (query === "edge") {
      commandToRun = isWindows ? "start msedge" : "open -a 'Microsoft Edge'";
    } else {
      shell.openExternal("https://google.com");
      return { success: true, message: "Opened default web browser" };
    }
  } else if (target.startsWith("http://") || target.startsWith("https://")) {
    await shell.openExternal(target);
    return { success: true, message: `Opened URL: ${target}` };
  } else {
    // If it's a specific path
    if (fs.existsSync(target)) {
      const openResult = await shell.openPath(target);
      if (openResult) {
        return { success: false, message: `Failed to open path: ${openResult}` };
      }
      return { success: true, message: `Opened ${target}` };
    }
    // Fallback: run user command
    commandToRun = target;
  }

  return new Promise((resolve) => {
    exec(commandToRun, (err) => {
      if (err) {
        // If command failed, check if it can be opened via shell
        shell.openPath(target).then((result) => {
          if (!result) {
            resolve({ success: true, message: `Opened ${target}` });
          } else {
            resolve({ success: false, message: `Failed to launch ${target}: ${err.message}` });
          }
        });
      } else {
        resolve({ success: true, message: `Successfully launched: ${target}` });
      }
    });
  });
});

// 4. Shell Open Path
ipcMain.handle("shell:open-path", async (_, targetPath) => {
  try {
    const error = await shell.openPath(targetPath);
    if (error) {
      return { success: false, message: error };
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// 5. Shell Show in Folder
ipcMain.handle("shell:show-in-folder", (_, targetPath) => {
  try {
    shell.showItemInFolder(targetPath);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// 6. Shell Open External Link
ipcMain.handle("shell:open-external", async (_, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// 7. List Directory Contents
ipcMain.handle("files:list-directory", async (_, dirPath) => {
  try {
    let resolvedPath = dirPath;
    if (!resolvedPath || resolvedPath === "home") {
      resolvedPath = os.homedir();
    } else if (resolvedPath === "desktop") {
      resolvedPath = path.join(os.homedir(), "Desktop");
    } else if (resolvedPath === "documents") {
      resolvedPath = path.join(os.homedir(), "Documents");
    } else if (resolvedPath === "downloads") {
      resolvedPath = path.join(os.homedir(), "Downloads");
    } else if (resolvedPath === "project") {
      resolvedPath = path.resolve(__dirname, "..");
    }

    if (!fs.existsSync(resolvedPath)) {
      resolvedPath = os.homedir();
    }

    const dirents = await fs.promises.readdir(resolvedPath, { withFileTypes: true });
    const items = [];

    for (const d of dirents) {
      // Skip hidden files starting with .
      if (d.name.startsWith(".")) continue;

      const fullPath = path.join(resolvedPath, d.name);
      try {
        const stats = await fs.promises.stat(fullPath);
        items.push({
          name: d.name,
          path: fullPath,
          isDirectory: d.isDirectory(),
          size: stats.size,
          modified: stats.mtime,
          ext: path.extname(d.name).replace(".", "").toLowerCase()
        });
      } catch {
        // Skip inaccessible items
      }
    }

    // Sort: directories first, then alphabetically
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      success: true,
      currentPath: resolvedPath,
      parentPath: path.dirname(resolvedPath),
      items: items.slice(0, 150)
    };
  } catch (err) {
    return { success: false, message: err.message, items: [], currentPath: dirPath || os.homedir() };
  }
});

// 8. Read File Content
ipcMain.handle("files:read-file", async (_, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, message: "File does not exist" };
    }
    const stats = await fs.promises.stat(filePath);
    if (stats.size > 3 * 1024 * 1024) {
      return { success: false, message: "File is too large (maximum 3MB supported)" };
    }
    const content = await fs.promises.readFile(filePath, "utf-8");
    return {
      success: true,
      filePath,
      fileName: path.basename(filePath),
      size: stats.size,
      modified: stats.mtime,
      content
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// 9. File Picker Dialog
ipcMain.handle("dialog:open-file", async (_, options = {}) => {
  try {
    const defaultFilters = [
      { name: "Text & Documents", extensions: ["txt", "md", "json", "js", "jsx", "ts", "tsx", "html", "css", "py", "csv", "log"] },
      { name: "All Files", extensions: ["*"] }
    ];

    const result = await dialog.showOpenDialog(mainWindow, {
      title: options.title || "Select a Document to Analyze",
      properties: ["openFile"],
      filters: options.filters || defaultFilters
    });

    return result;
  } catch (err) {
    return { canceled: true, error: err.message, filePaths: [] };
  }
});

// 10. Native Notification
ipcMain.handle("notification:send", (_, { title, body }) => {
  try {
    if (Notification.isSupported()) {
      new Notification({
        title: title || "AI Companion Notification",
        body: body || "You have a reminder from your AI companion."
      }).show();
      return { success: true };
    }
    return { success: false, message: "Notifications not supported on this system" };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// 11. Window Controls
ipcMain.handle("window:minimize", () => {
  if (mainWindow) mainWindow.minimize();
});
ipcMain.handle("window:maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});
ipcMain.handle("window:close", () => {
  if (mainWindow) mainWindow.close();
});
ipcMain.handle("window:is-maximized", () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});
ipcMain.handle("window:focus", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

// 12. Desktop Overlay Companion Handlers
ipcMain.handle("overlay:trigger", (_, data) => {
  try {
    if (!overlayWindow || overlayWindow.isDestroyed()) {
      createOverlayWindow();
    }
    if (overlayWindow) {
      overlayWindow.show();
      overlayWindow.setAlwaysOnTop(true, "screen-saver");
      overlayWindow.webContents.send("overlay:show-avatar", data);
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle("overlay:hide", () => {
  try {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.hide();
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// App Lifecycle
app.whenReady().then(() => {
  createWindow();
  // Pre-create overlay window so pop-up triggers instantly
  setTimeout(() => {
    createOverlayWindow();
  }, 1000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  app.isQuitting = true;
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
