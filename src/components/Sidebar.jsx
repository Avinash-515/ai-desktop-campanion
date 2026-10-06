import React from "react";
import {
  IconDashboard,
  IconChat,
  IconApps,
  IconFiles,
  IconDocument,
  IconReminders,
  IconSettings,
  IconSparkles
} from "./Icons";

export function Sidebar({
  activeTab,
  onSelectTab,
  pendingRemindersCount = 0,
  systemStats,
  appInfo
}) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", subtitle: "Companion & 3D Studio", icon: IconDashboard, badge: null },
    { id: "chat", label: "Interactive Chat", subtitle: "AI Dialogue & Tools", icon: IconChat, badge: null },
    { id: "apps", label: "Applications", subtitle: "Quick Launcher", icon: IconApps, badge: null },
    { id: "files", label: "Files Explorer", subtitle: "Local Filesystem", icon: IconFiles, badge: null },
    { id: "documents", label: "Documents", subtitle: "AI Summarizer", icon: IconDocument, badge: null },
    {
      id: "reminders",
      label: "Reminders",
      subtitle: "Alerts & Timers",
      icon: IconReminders,
      badge: pendingRemindersCount > 0 ? pendingRemindersCount : null
    },
    { id: "settings", label: "Settings", subtitle: "Persona & Hardware", icon: IconSettings, badge: null }
  ];

  return (
    <aside className="sidebar">
      <div className="logo-section">
        <div className="logo-badge">
          <div className="logo-glow"></div>
          <IconSparkles size={20} className="logo-svg" />
        </div>
        <div className="logo-text">
          <div className="flex-row items-center gap-1">
            <span className="logo-title">AI Companion</span>
            <span className="logo-version-tag">2.0</span>
          </div>
          <span className="logo-sub">Desktop OS Assistant</span>
        </div>
      </div>

      <div className="nav-group-label">WORKSPACE TABS</div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-button ${isActive ? "active" : ""}`}
              onClick={() => onSelectTab(item.id)}
              aria-selected={isActive}
              role="tab"
            >
              {isActive && <span className="nav-glow-accent" />}
              <span className="nav-icon-wrap">
                <Icon size={18} />
              </span>
              <div className="nav-text-col">
                <span className="nav-label">{item.label}</span>
                <span className="nav-sub-label">{item.subtitle}</span>
              </div>
              {item.badge !== null && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-status-card">
          <div className="footer-status-header">
            <div className="flex-row items-center gap-1">
              <span className="status-pulse-dot"></span>
              <span className="footer-status-title">Desktop Bridge</span>
            </div>
            <span className="footer-env-badge">
              {appInfo?.platform === "win32" ? "Win32" : appInfo?.platform || "Online"}
            </span>
          </div>

          <div className="footer-metrics">
            <div className="footer-metric-row">
              <span>RAM USAGE</span>
              <span className="footer-metric-val">
                {systemStats ? `${systemStats.memPercent}%` : "Ready"}
              </span>
            </div>
            <div className="footer-progress">
              <div
                className="footer-progress-bar"
                style={{ width: `${systemStats?.memPercent || 42}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
