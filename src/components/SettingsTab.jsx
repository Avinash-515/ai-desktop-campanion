import React, { useState } from "react";
import { IconSettings, IconCpu, IconVolume, IconSparkles, IconCheck, IconRefresh } from "./Icons";
import { PERSONALITIES } from "../services/aiEngine";
import { desktopService } from "../services/desktopService";

export function SettingsTab({
  personaKey,
  onSelectPersona,
  companionName,
  onChangeCompanionName,
  geminiApiKey,
  onChangeGeminiApiKey,
  geminiModel,
  onChangeGeminiModel,
  soundEnabled,
  onToggleSound,
  notificationsEnabled,
  onToggleNotifications,
  accentColor,
  onChangeAccentColor,
  systemStats,
  onRefreshStats,
  appInfo,
  onAddToast
}) {
  const [showKey, setShowKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);

  const accents = [
    { id: "blue", label: "Electric Blue", color: "#3b82f6" },
    { id: "teal", label: "Cyber Teal", color: "#14b8a6" },
    { id: "purple", label: "Neon Violet", color: "#8b5cf6" },
    { id: "amber", label: "Sunset Amber", color: "#f59e0b" }
  ];

  const handleTestApiKey = async () => {
    if (!geminiApiKey || geminiApiKey.trim().length < 10) {
      onAddToast({
        type: "warning",
        title: "API Key Missing",
        message: "Please enter your Gemini API key first."
      });
      return;
    }

    setIsTestingKey(true);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey.trim()}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Respond with: 'Connection verified.'" }] }]
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      onAddToast({
        type: "success",
        title: "Gemini API Connected!",
        message: `Response: ${reply || "Success"}`
      });
    } catch (err) {
      onAddToast({
        type: "error",
        title: "Connection Failed",
        message: err.message
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSendTestNotification = async () => {
    const res = await desktopService.sendNotification(
      "AI Companion Notification Test",
      "Desktop alert bridge is working perfectly!"
    );
    onAddToast({
      type: "info",
      title: "Notification Sent",
      message: res.success ? "Check your desktop notifications" : res.message
    });
  };

  return (
    <div className="tab-page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Settings & System Diagnostics</h2>
          <p className="page-subtitle">
            Configure companion intelligence, theme aesthetics, and inspect hardware telemetry.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Companion Personality */}
        <div className="panel-card">
          <div className="panel-card-header">
            <span className="panel-icon">🎭</span>
            <div>
              <h3 className="panel-title">Companion Persona & Identity</h3>
              <p className="panel-subtitle">Select your companion's voice, tone, and character.</p>
            </div>
          </div>

          <div className="persona-selection-grid">
            {Object.entries(PERSONALITIES).map(([key, p]) => (
              <button
                key={key}
                className={`persona-card ${personaKey === key ? "active" : ""}`}
                onClick={() => onSelectPersona(key)}
              >
                <div className="persona-top">
                  <span className="persona-name">{p.name}</span>
                  {personaKey === key && <span className="active-tag">Active</span>}
                </div>
                <p className="persona-desc">{p.tagline}</p>
              </button>
            ))}
          </div>

          <div className="form-group mt-4">
            <label>Companion Display Name</label>
            <input
              type="text"
              className="form-input"
              value={companionName}
              onChange={(e) => onChangeCompanionName(e.target.value)}
              placeholder="e.g. Nova, Jarvis, Cortex"
            />
          </div>
        </div>

        {/* AI Engine & Gemini API */}
        <div className="panel-card">
          <div className="panel-card-header">
            <span className="panel-icon">✨</span>
            <div>
              <h3 className="panel-title">AI Intelligence Engine</h3>
              <p className="panel-subtitle">Built-in local engine + optional Google Gemini API.</p>
            </div>
          </div>

          <div className="engine-status-box">
            <div className="engine-badge-row">
              <span className="engine-indicator"></span>
              <span className="engine-title">
                {geminiApiKey.trim() ? "Dual Mode: Gemini API + Local Intents" : "Active: Built-in Local Intelligence"}
              </span>
            </div>
            <p className="engine-desc">
              {geminiApiKey.trim()
                ? "Your companion queries Google Gemini for broad generative knowledge while executing desktop actions locally."
                : "The companion operates 100% locally and privately with built-in intent parsing. Add a Gemini API key below to unlock advanced conversational AI."}
            </p>
          </div>

          <div className="form-group mt-3">
            <label>Google Gemini API Key (Optional)</label>
            <div className="input-with-button">
              <input
                type={showKey ? "text" : "password"}
                className="form-input"
                placeholder="AIzaSy..."
                value={geminiApiKey}
                onChange={(e) => onChangeGeminiApiKey(e.target.value)}
              />
              <button
                type="button"
                className="inline-btn"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="form-row mt-3">
            <div className="form-group flex-1">
              <label>Model Version</label>
              <select
                className="form-select"
                value={geminiModel}
                onChange={(e) => onChangeGeminiModel(e.target.value)}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra-fast, Recommended)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
              </select>
            </div>

            <div className="form-group flex-initial flex-end">
              <button
                type="button"
                className="test-api-btn"
                onClick={handleTestApiKey}
                disabled={isTestingKey || !geminiApiKey.trim()}
              >
                {isTestingKey ? "Testing..." : "Test Connection"}
              </button>
            </div>
          </div>
        </div>

        {/* Preferences & Appearance */}
        <div className="panel-card">
          <div className="panel-card-header">
            <span className="panel-icon">🎨</span>
            <div>
              <h3 className="panel-title">Appearance & Preferences</h3>
              <p className="panel-subtitle">Customize theme accents and desktop feedback.</p>
            </div>
          </div>

          <div className="form-group">
            <label>Accent Color</label>
            <div className="accent-swatches">
              {accents.map((a) => (
                <button
                  key={a.id}
                  className={`accent-swatch-btn ${accentColor === a.id ? "active" : ""}`}
                  onClick={() => onChangeAccentColor(a.id)}
                >
                  <span className="swatch-circle" style={{ backgroundColor: a.color }}></span>
                  <span className="swatch-label">{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="toggle-list mt-3">
            <div className="toggle-item">
              <div>
                <span className="toggle-title">Web Audio Sound Effects</span>
                <p className="toggle-sub">Play subtle futuristic audio cues on sends and alerts.</p>
              </div>
              <button
                className={`switch-btn ${soundEnabled ? "on" : "off"}`}
                onClick={onToggleSound}
              >
                <span className="switch-knob"></span>
              </button>
            </div>

            <div className="toggle-item">
              <div>
                <span className="toggle-title">Desktop Push Notifications</span>
                <p className="toggle-sub">Allow native operating system alerts for reminders.</p>
              </div>
              <div className="flex-row items-center gap-2">
                <button
                  className="inline-test-btn"
                  onClick={handleSendTestNotification}
                >
                  Test
                </button>
                <button
                  className={`switch-btn ${notificationsEnabled ? "on" : "off"}`}
                  onClick={onToggleNotifications}
                >
                  <span className="switch-knob"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Hardware Diagnostics */}
        <div className="panel-card">
          <div className="panel-card-header justify-between">
            <div className="flex-row items-center gap-2">
              <span className="panel-icon">💻</span>
              <div>
                <h3 className="panel-title">Hardware Telemetry</h3>
                <p className="panel-subtitle">Real-time inspection of CPU, RAM, and OS platform.</p>
              </div>
            </div>
            <button className="path-refresh-btn" onClick={onRefreshStats} title="Refresh Hardware Metrics">
              <IconRefresh size={14} />
            </button>
          </div>

          <div className="diag-stats-grid">
            <div className="diag-stat-cell">
              <span className="diag-label">Processor</span>
              <span className="diag-val">{systemStats?.cpuModel || "Detected"}</span>
              <span className="diag-sub">{systemStats?.cpuCount} Logical Cores</span>
            </div>

            <div className="diag-stat-cell">
              <span className="diag-label">RAM Memory</span>
              <span className="diag-val">
                {systemStats ? `${systemStats.usedMemGB} GB / ${systemStats.totalMemGB} GB` : "16.0 GB"}
              </span>
              <span className="diag-sub">{systemStats?.memPercent}% Utilized</span>
            </div>

            <div className="diag-stat-cell">
              <span className="diag-label">Operating System</span>
              <span className="diag-val">
                {systemStats?.platform === "win32" ? "Windows" : systemStats?.platform || "Desktop OS"}
              </span>
              <span className="diag-sub">Kernel: {systemStats?.release || "Release"}</span>
            </div>

            <div className="diag-stat-cell">
              <span className="diag-label">Runtime Engine</span>
              <span className="diag-val">
                {appInfo?.electronVersion ? `Electron ${appInfo.electronVersion}` : "Vite + React 19"}
              </span>
              <span className="diag-sub">Node: {appInfo?.nodeVersion || "Modern"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
