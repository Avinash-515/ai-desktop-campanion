import React, { useState } from "react";
import { IconApps, IconSparkles } from "./Icons";
import { desktopService } from "../services/desktopService";

const APP_PRESETS = [
  {
    id: "vscode",
    name: "Visual Studio Code",
    category: "development",
    command: "code",
    icon: "💻",
    description: "Source code editor, extensions, terminal",
    badge: "IDE"
  },
  {
    id: "terminal",
    name: "Terminal / PowerShell",
    category: "development",
    command: "terminal",
    icon: "⚡",
    description: "Command line shell, scripts & automation",
    badge: "CLI"
  },
  {
    id: "explorer",
    name: "File Explorer",
    category: "utilities",
    command: "explorer",
    icon: "📁",
    description: "Browse folders, drives, and file paths",
    badge: "System"
  },
  {
    id: "browser",
    name: "Web Browser",
    category: "productivity",
    command: "browser",
    icon: "🌐",
    description: "Default internet browser & search",
    badge: "Web"
  },
  {
    id: "calculator",
    name: "Calculator",
    category: "utilities",
    command: "calc",
    icon: "🧮",
    description: "Quick calculations, programmer calculator",
    badge: "Tools"
  },
  {
    id: "notepad",
    name: "Notepad / Text Editor",
    category: "productivity",
    command: "notepad",
    icon: "📝",
    description: "Plain text editor for scratchpads & logs",
    badge: "Notes"
  },
  {
    id: "taskmgr",
    name: "Task Manager",
    category: "system",
    command: "taskmgr",
    icon: "📊",
    description: "Inspect active CPU, memory & processes",
    badge: "Performance"
  },
  {
    id: "settings",
    name: "Windows Settings",
    category: "system",
    command: "settings",
    icon: "⚙️",
    description: "Display, network, sound & preferences",
    badge: "OS"
  },
  {
    id: "chrome",
    name: "Google Chrome",
    category: "productivity",
    command: "chrome",
    icon: "🧭",
    description: "Fast browsing and developer inspection",
    badge: "Web"
  },
  {
    id: "cmd",
    name: "Command Prompt",
    category: "development",
    command: "cmd",
    icon: "⌨️",
    description: "Classic Windows command prompt",
    badge: "CLI"
  }
];

export function ApplicationsTab({ onAddToast, soundService, soundEnabled }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [customCommand, setCustomCommand] = useState("");
  const [launchingId, setLaunchingId] = useState(null);
  const [recentLaunches, setRecentLaunches] = useState(() => {
    try {
      const saved = localStorage.getItem("companion_recent_apps");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const categories = [
    { id: "all", label: "All Apps" },
    { id: "development", label: "Development" },
    { id: "productivity", label: "Productivity" },
    { id: "utilities", label: "Utilities" },
    { id: "system", label: "System" }
  ];

  const filteredApps =
    activeCategory === "all"
      ? APP_PRESETS
      : APP_PRESETS.filter((app) => app.category === activeCategory);

  const handleLaunch = async (app) => {
    setLaunchingId(app.id);
    if (soundEnabled && soundService?.playLaunch) {
      soundService.playLaunch();
    }

    const res = await desktopService.launchApp(app.command);
    setLaunchingId(null);

    // Save to recents
    const updated = [
      { id: app.id, name: app.name, icon: app.icon, command: app.command, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ...recentLaunches.filter((r) => r.command !== app.command)
    ].slice(0, 6);

    setRecentLaunches(updated);
    try {
      localStorage.setItem("companion_recent_apps", JSON.stringify(updated));
    } catch {}

    onAddToast({
      type: res.success ? "success" : "error",
      title: app.name,
      message: res.message || (res.success ? "Launched successfully" : "Failed to launch")
    });
  };

  const handleCustomLaunch = async (e) => {
    e.preventDefault();
    if (!customCommand.trim()) return;

    const cmd = customCommand.trim();
    if (soundEnabled && soundService?.playLaunch) {
      soundService.playLaunch();
    }

    const res = await desktopService.launchApp(cmd);
    onAddToast({
      type: res.success ? "success" : "error",
      title: "Custom Command",
      message: res.message || `Executed: ${cmd}`
    });

    const updated = [
      { id: "custom-" + Date.now(), name: cmd, icon: "🚀", command: cmd, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ...recentLaunches
    ].slice(0, 6);
    setRecentLaunches(updated);
    try {
      localStorage.setItem("companion_recent_apps", JSON.stringify(updated));
    } catch {}

    setCustomCommand("");
  };

  return (
    <div className="tab-page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Applications Launcher</h2>
          <p className="page-subtitle">
            Trigger native desktop programs, tools, and custom shell commands seamlessly.
          </p>
        </div>

        <div className="category-pill-group">
          {categories.map((c) => (
            <button
              key={c.id}
              className={`category-pill ${activeCategory === c.id ? "active" : ""}`}
              onClick={() => setActiveCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="apps-grid">
        {filteredApps.map((app) => {
          const isLaunching = launchingId === app.id;
          return (
            <div key={app.id} className="app-card">
              <div className="app-card-top">
                <div className="app-icon-wrap">{app.icon}</div>
                <span className="app-badge">{app.badge}</span>
              </div>

              <div className="app-card-body">
                <h3 className="app-name">{app.name}</h3>
                <p className="app-desc">{app.description}</p>
              </div>

              <div className="app-card-footer">
                <code className="app-cmd-tag">{app.command}</code>
                <button
                  className="app-launch-btn"
                  onClick={() => handleLaunch(app)}
                  disabled={isLaunching}
                >
                  {isLaunching ? "Launching..." : "Launch →"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="section-divider"></div>

      <div className="two-col-row">
        {/* Custom Launcher */}
        <div className="panel-card">
          <div className="panel-card-header">
            <span className="panel-icon">⚡</span>
            <div>
              <h3 className="panel-title">Custom Command / Path Launcher</h3>
              <p className="panel-subtitle">
                Enter an executable name, folder path, website URL, or system command.
              </p>
            </div>
          </div>

          <form className="custom-launch-form" onSubmit={handleCustomLaunch}>
            <input
              type="text"
              className="custom-input"
              placeholder="e.g. https://github.com, code ., mspaint, or C:/MyFolder"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
            />
            <button type="submit" className="custom-submit-btn" disabled={!customCommand.trim()}>
              Execute
            </button>
          </form>
        </div>

        {/* Recent Launches */}
        <div className="panel-card">
          <div className="panel-card-header">
            <span className="panel-icon">🕒</span>
            <div>
              <h3 className="panel-title">Recent Launches</h3>
              <p className="panel-subtitle">Quickly re-trigger applications launched recently.</p>
            </div>
          </div>

          {recentLaunches.length === 0 ? (
            <div className="empty-recents">No recent applications launched yet.</div>
          ) : (
            <div className="recent-list">
              {recentLaunches.map((item, i) => (
                <div key={i} className="recent-item">
                  <div className="recent-item-left">
                    <span>{item.icon}</span>
                    <span className="recent-name">{item.name}</span>
                    <span className="recent-time">{item.time}</span>
                  </div>
                  <button
                    className="recent-relaunch-btn"
                    onClick={() => handleLaunch({ id: item.id, name: item.name, command: item.command })}
                  >
                    Relaunch
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
