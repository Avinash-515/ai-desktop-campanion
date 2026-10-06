// Desktop Service - abstraction over window.desktopAPI with graceful fallback for web/preview mode

const isElectronAvailable = typeof window !== "undefined" && Boolean(window.desktopAPI);

// Mock directory contents for browser preview mode
const mockBrowserFiles = [
  { name: "src", path: "/project/src", isDirectory: true, size: 4096, modified: new Date(), ext: "" },
  { name: "electron", path: "/project/electron", isDirectory: true, size: 4096, modified: new Date(), ext: "" },
  { name: "public", path: "/project/public", isDirectory: true, size: 4096, modified: new Date(), ext: "" },
  { name: "package.json", path: "/project/package.json", isDirectory: false, size: 840, modified: new Date(), ext: "json" },
  { name: "README.md", path: "/project/README.md", isDirectory: false, size: 1024, modified: new Date(), ext: "md" },
  { name: "vite.config.js", path: "/project/vite.config.js", isDirectory: false, size: 240, modified: new Date(), ext: "js" },
  { name: "meeting-notes.txt", path: "/project/meeting-notes.txt", isDirectory: false, size: 520, modified: new Date(), ext: "txt" },
  { name: "project-roadmap.md", path: "/project/project-roadmap.md", isDirectory: false, size: 1840, modified: new Date(), ext: "md" }
];

export const desktopService = {
  isElectron() {
    return isElectronAvailable;
  },

  async getAppInfo() {
    if (isElectronAvailable && window.desktopAPI.getAppInfo) {
      return await window.desktopAPI.getAppInfo();
    }
    return {
      name: "AI Desktop Companion (Web Mode)",
      platform: "browser",
      version: "1.0.0",
      arch: "x64",
      electronVersion: "N/A (Browser)",
      nodeVersion: "N/A",
      uptime: Math.round(performance.now() / 1000),
      homedir: "C:/Users/User",
      hostname: "localhost"
    };
  },

  async getSystemStats() {
    if (isElectronAvailable && window.desktopAPI.getSystemStats) {
      return await window.desktopAPI.getSystemStats();
    }
    // Realistic browser simulation stats
    const totalMemGB = 16.0;
    const usedMemGB = 6.8 + (Math.sin(Date.now() / 10000) * 0.8);
    const freeMemGB = (totalMemGB - usedMemGB).toFixed(1);
    const memPercent = Math.round((usedMemGB / totalMemGB) * 100);

    return {
      cpuModel: "Intel(R) Core(TM) i7-13700H @ 2.40GHz",
      cpuCount: 14,
      cpuSpeed: 2400,
      totalMemGB: totalMemGB.toFixed(1),
      freeMemGB,
      usedMemGB: usedMemGB.toFixed(1),
      memPercent,
      platform: "win32",
      release: "10.0.22631",
      arch: "x64",
      hostname: "DESKTOP-COMPANION",
      uptimeSeconds: Math.floor(performance.now() / 1000) + 14200,
      homeDir: "C:/Users/User"
    };
  },

  async launchApp(target) {
    if (isElectronAvailable && window.desktopAPI.launchApp) {
      return await window.desktopAPI.launchApp(target);
    }
    return {
      success: true,
      message: `[Simulated] Launched application: ${target}`
    };
  },

  async openPath(targetPath) {
    if (isElectronAvailable && window.desktopAPI.openPath) {
      return await window.desktopAPI.openPath(targetPath);
    }
    return { success: true, message: `[Simulated] Opened path: ${targetPath}` };
  },

  async showInFolder(targetPath) {
    if (isElectronAvailable && window.desktopAPI.showInFolder) {
      return await window.desktopAPI.showInFolder(targetPath);
    }
    return { success: true, message: `[Simulated] Revealed in folder: ${targetPath}` };
  },

  async openExternal(url) {
    if (isElectronAvailable && window.desktopAPI.openExternal) {
      return await window.desktopAPI.openExternal(url);
    }
    window.open(url, "_blank");
    return { success: true };
  },

  async listDirectory(dirPath = "documents") {
    if (isElectronAvailable && window.desktopAPI.listDirectory) {
      return await window.desktopAPI.listDirectory(dirPath);
    }
    return {
      success: true,
      currentPath: `C:/Users/User/${dirPath}`,
      parentPath: "C:/Users/User",
      items: mockBrowserFiles
    };
  },

  async readFile(filePath) {
    if (isElectronAvailable && window.desktopAPI.readFile) {
      return await window.desktopAPI.readFile(filePath);
    }
    return {
      success: true,
      filePath,
      fileName: filePath.split("/").pop() || "sample.txt",
      size: 1420,
      modified: new Date(),
      content: `# Sample Document: AI Desktop Companion

Welcome to your intelligent Desktop Companion.
This companion connects with your local operating system, monitors hardware, launches tools, and helps you organize your daily workflow.

## Key Capabilities:
- Application Quick Launcher: Launch IDEs, terminals, browsers, and utilities in milliseconds.
- Local File Intelligence: Search and inspect files without leaving your current workspace.
- Document Summarizer: Extract key findings, takeaways, and action items from any notes or documents.
- Desktop Reminders: Keep your day structured with audio and push alerts.
- AI Assistant: Ask questions, draft code, query system status, and automate daily tasks.`
    };
  },

  async openFileDialog(options) {
    if (isElectronAvailable && window.desktopAPI.openFileDialog) {
      return await window.desktopAPI.openFileDialog(options);
    }
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".txt,.md,.json,.js,.jsx,.ts,.tsx,.html,.css,.py,.csv";
      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
          resolve({ canceled: true, filePaths: [] });
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            canceled: false,
            filePaths: [file.name],
            mockFile: {
              fileName: file.name,
              filePath: file.name,
              size: file.size,
              content: reader.result
            }
          });
        };
        reader.readAsText(file);
      };
      input.click();
    });
  },

  async sendNotification(title, body) {
    if (isElectronAvailable && window.desktopAPI.sendNotification) {
      return await window.desktopAPI.sendNotification({ title, body });
    }
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const notif = new Notification(title, {
          body,
          icon: "/favicon.svg",
          requireInteraction: true
        });
        notif.onclick = () => {
          if (typeof window !== "undefined") {
            window.focus();
          }
        };
      } catch (err) {
        console.warn("Notification error:", err);
      }
      return { success: true };
    } else if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          try {
            const notif = new Notification(title, {
              body,
              icon: "/favicon.svg",
              requireInteraction: true
            });
            notif.onclick = () => {
              if (typeof window !== "undefined") {
                window.focus();
              }
            };
          } catch (err) {
            console.warn("Notification error:", err);
          }
        }
      });
    }
    return { success: true };
  },

  isPiPSupported() {
    return typeof window !== "undefined" && "documentPictureInPicture" in window;
  },

  windowMinimize() {
    if (isElectronAvailable && window.desktopAPI.minimizeWindow) {
      window.desktopAPI.minimizeWindow();
    }
  },

  windowMaximize() {
    if (isElectronAvailable && window.desktopAPI.maximizeWindow) {
      window.desktopAPI.maximizeWindow();
    }
  },

  windowClose() {
    if (isElectronAvailable && window.desktopAPI.closeWindow) {
      window.desktopAPI.closeWindow();
    }
  },

  focusWindow() {
    if (isElectronAvailable && window.desktopAPI.focusWindow) {
      window.desktopAPI.focusWindow();
    }
  },

  triggerOverlay(payload) {
    if (isElectronAvailable && window.desktopAPI.triggerOverlay) {
      window.desktopAPI.triggerOverlay(payload);
    }
  },

  hideOverlay() {
    if (isElectronAvailable && window.desktopAPI.hideOverlay) {
      window.desktopAPI.hideOverlay();
    }
  },

  onShowAvatar(callback) {
    if (isElectronAvailable && window.desktopAPI.onShowAvatar) {
      window.desktopAPI.onShowAvatar(callback);
    }
  }
};

