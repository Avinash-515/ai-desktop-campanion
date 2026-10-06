const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  isElectron: true,
  getAppInfo: () => ipcRenderer.invoke("app:get-info"),
  getSystemStats: () => ipcRenderer.invoke("system:get-stats"),
  launchApp: (target) => ipcRenderer.invoke("app:launch", target),
  openPath: (targetPath) => ipcRenderer.invoke("shell:open-path", targetPath),
  showInFolder: (targetPath) => ipcRenderer.invoke("shell:show-in-folder", targetPath),
  openExternal: (url) => ipcRenderer.invoke("shell:open-external", url),
  listDirectory: (dirPath) => ipcRenderer.invoke("files:list-directory", dirPath),
  readFile: (filePath) => ipcRenderer.invoke("files:read-file", filePath),
  openFileDialog: (options) => ipcRenderer.invoke("dialog:open-file", options),
  sendNotification: (payload) => ipcRenderer.invoke("notification:send", payload),
  minimizeWindow: () => ipcRenderer.invoke("window:minimize"),
  maximizeWindow: () => ipcRenderer.invoke("window:maximize"),
  closeWindow: () => ipcRenderer.invoke("window:close"),
  isWindowMaximized: () => ipcRenderer.invoke("window:is-maximized"),
  focusWindow: () => ipcRenderer.invoke("window:focus"),
  triggerOverlay: (payload) => ipcRenderer.invoke("overlay:trigger", payload),
  hideOverlay: () => ipcRenderer.invoke("overlay:hide"),
  onShowAvatar: (callback) => {
    ipcRenderer.on("overlay:show-avatar", (_, data) => callback(data));
  }
});
