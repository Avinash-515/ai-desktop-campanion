import React from "react";
import { IconCpu, IconVolume } from "./Icons";
import { desktopService } from "../services/desktopService";

export function Header({
  activeTab,
  tabTitles,
  systemStats,
  soundEnabled,
  onToggleSound,
  persona,
  isElectron
}) {
  const memPercent = systemStats?.memPercent ?? 42;
  const cpuSpeed = systemStats?.cpuCount ? `${systemStats.cpuCount} Cores` : "Active";

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="breadcrumb">
          <span className="app-title-badge">Companion</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{tabTitles[activeTab] || "Chat"}</span>
        </div>
        <div className="persona-pill" title={`Active Persona: ${persona.name}`}>
          <span className="pulse-dot"></span>
          <span>{persona.name} AI</span>
        </div>
      </div>

      <div className="header-center">
        {systemStats && (
          <div className="system-telemetry-pill">
            <div className="telemetry-item" title={`CPU: ${systemStats.cpuModel}`}>
              <IconCpu size={14} className="telemetry-icon" />
              <span className="telemetry-label">CPU</span>
              <span className="telemetry-val">{cpuSpeed}</span>
            </div>
            <div className="telemetry-divider"></div>
            <div className="telemetry-item" title={`RAM Used: ${systemStats.usedMemGB} GB / ${systemStats.totalMemGB} GB`}>
              <div className="telemetry-bar-wrap">
                <div
                  className={`telemetry-bar-fill ${memPercent > 80 ? "critical" : memPercent > 60 ? "warning" : ""}`}
                  style={{ width: `${memPercent}%` }}
                ></div>
              </div>
              <span className="telemetry-label">RAM</span>
              <span className="telemetry-val">{memPercent}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="header-right">
        <button
          className={`icon-btn ${!soundEnabled ? "muted" : ""}`}
          onClick={onToggleSound}
          title={soundEnabled ? "Sound FX Enabled" : "Sound FX Muted"}
          aria-label="Toggle Sound Effects"
        >
          <IconVolume size={16} muted={!soundEnabled} />
        </button>

        {isElectron && (
          <div className="window-controls">
            <button
              className="win-btn win-min"
              onClick={() => desktopService.windowMinimize()}
              title="Minimize"
              aria-label="Minimize Window"
            >
              ─
            </button>
            <button
              className="win-btn win-max"
              onClick={() => desktopService.windowMaximize()}
              title="Maximize"
              aria-label="Maximize Window"
            >
              □
            </button>
            <button
              className="win-btn win-close"
              onClick={() => desktopService.windowClose()}
              title="Close"
              aria-label="Close Window"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
