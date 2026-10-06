import React, { useState, useEffect } from "react";
import { VirtualHuman3D } from "./VirtualHuman3D";
import { IconCheck, IconSparkles, IconReminders, IconTrash } from "./Icons";

export function DashboardTab({
  reminders,
  onAddReminder,
  onToggleComplete,
  onDeleteReminder,
  onSnoozeReminder,
  onTriggerDesktopAlert,
  avatarConfig,
  onChangeAvatarConfig,
  onOpenCreateModal,
  hydrationCount,
  onIncrementHydration,
  isPiPSupported,
  isPiPActive,
  onTogglePiP
}) {
  const [previewState, setPreviewState] = useState("idle");
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [reminderFilter, setReminderFilter] = useState("all"); // 'all' | 'pending' | 'completed'

  // Live timer tick for accurate countdowns and clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Time-based greeting & mood
  const now = new Date(currentTime);
  const hour = now.getHours();
  const greeting =
    hour < 12
      ? "Good Morning!"
      : hour < 17
      ? "Good Afternoon!"
      : hour < 21
      ? "Good Evening!"
      : "Working Late Tonight?";

  const timeGreetingBadge =
    hour < 12
      ? { icon: "🌅", label: "Morning Focus" }
      : hour < 17
      ? { icon: "☀️", label: "Peak Productivity" }
      : hour < 21
      ? { icon: "🌆", label: "Evening Flow" }
      : { icon: "🌙", label: "Night Shift" };

  const digitalTimeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const dateStr = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  // Find next upcoming reminder
  const activeReminders = reminders
    .filter((r) => !r.completed)
    .sort((a, b) => a.dueAt - b.dueAt);

  const nextReminder = activeReminders.length > 0 ? activeReminders[0] : null;

  // Format time (e.g. 10:30 AM)
  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  // Live countdown string
  let countdownLabel = "";
  let isDueSoon = false;
  if (nextReminder) {
    const diffMs = nextReminder.dueAt - currentTime;
    if (diffMs <= 0) {
      countdownLabel = "Due Now!";
      isDueSoon = true;
    } else if (diffMs < 60000) {
      const sec = Math.ceil(diffMs / 1000);
      countdownLabel = `Due in ${sec}s`;
      isDueSoon = true;
    } else {
      const min = Math.floor(diffMs / 60000);
      const sec = Math.floor((diffMs % 60000) / 1000);
      countdownLabel = `Due in ${min}m ${sec.toString().padStart(2, "0")}s`;
      isDueSoon = diffMs < 5 * 60000;
    }
  }

  const outfitColors = [
    { name: "Electric Blue", hex: "#2563eb" },
    { name: "Emerald Mint", hex: "#10b981" },
    { name: "Cyber Purple", hex: "#8b5cf6" },
    { name: "Sunset Amber", hex: "#f59e0b" },
    { name: "Neon Rose", hex: "#f43f5e" },
    { name: "Midnight Slate", hex: "#334155" }
  ];

  const currentOutfitHex = avatarConfig?.hoodieColor || avatarConfig?.color || "#2563eb";
  const activeColorObj = outfitColors.find((c) => c.hex === currentOutfitHex) || {
    name: "Custom",
    hex: currentOutfitHex
  };

  // Filtered reminders for the table
  const filteredReminders = reminders.filter((r) => {
    if (reminderFilter === "pending") return !r.completed;
    if (reminderFilter === "completed") return r.completed;
    return true;
  });

  const hydrationPercent = Math.min(100, Math.round((hydrationCount / 8) * 100));

  return (
    <div className="tab-page-container dashboard-page">
      {/* Top Split Layout: Avatar Studio (Left) + Greeting & Next Reminder (Right) */}
      <div className="dashboard-top-grid">
        {/* Left: Interactive 3D Human Avatar Studio & Customization */}
        <div className="avatar-studio-card">
          <div className="studio-card-header">
            <div className="flex-row items-center gap-2">
              <span className="live-pulse-dot"></span>
              <span className="studio-title">3D Virtual Human Companion</span>
            </div>
            <div className="studio-badges-row">
              <span className="studio-fps-tag">60 FPS</span>
              <span className="studio-status-tag">Live 3D</span>
              {isPiPSupported && (
                <button
                  className={`btn-float-pip ${isPiPActive ? "active" : ""}`}
                  onClick={onTogglePiP}
                  title="Float 3D Avatar in an Always-On-Top window over all other browser tabs and apps"
                >
                  {isPiPActive ? "📌 Floating (On Screen)" : "📌 Float on Screen"}
                </button>
              )}
            </div>
          </div>

          {/* Live Animated 3D Human Avatar Component with Ambient Pedestal */}
          <div className="studio-avatar-viewport">
            {/* Ambient Aura Glow matching outfit color */}
            <div
              className="studio-avatar-ambient-glow"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${currentOutfitHex}40 0%, ${currentOutfitHex}15 45%, transparent 70%)`
              }}
            />

            {/* Holographic floor disc */}
            <div
              className="studio-floor-pedestal"
              style={{
                boxShadow: `0 0 28px ${currentOutfitHex}33, inset 0 0 16px ${currentOutfitHex}22`
              }}
            />

            <VirtualHuman3D
              animationState={previewState}
              characterConfig={avatarConfig}
              width={280}
              height={280}
            />
          </div>

          {/* Quick Expression Switcher */}
          <div className="studio-controls-bar">
            <div className="controls-label-row">
              <span className="controls-tiny-label">TEST 3D ANIMATION:</span>
              <span className="controls-current-state">Current: {previewState.toUpperCase()}</span>
            </div>
            <div className="expression-pills">
              {[
                { id: "idle", label: "🧍 Idle Focus" },
                { id: "drink", label: "💧 Drink Water" },
                { id: "wave", label: "👋 Friendly Wave" },
                { id: "snooze", label: "😴 Quick Snooze" },
                { id: "walk_in", label: "🚶 Walk In" }
              ].map((s) => (
                <button
                  key={s.id}
                  className={`exp-pill ${previewState === s.id ? "active" : ""}`}
                  onClick={() => setPreviewState(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Hoodie Outfit Customizer */}
            <div className="color-customizer-row">
              <div className="color-labels-wrap">
                <span className="controls-tiny-label">HOODIE OUTFIT:</span>
                <span className="color-name-badge" style={{ color: currentOutfitHex }}>
                  {activeColorObj.name}
                </span>
              </div>
              <div className="color-dots-list">
                {outfitColors.map((c) => (
                  <button
                    key={c.hex}
                    className={`visor-color-dot ${currentOutfitHex === c.hex ? "active" : ""}`}
                    style={{
                      backgroundColor: c.hex,
                      boxShadow: currentOutfitHex === c.hex ? `0 0 12px ${c.hex}` : "none"
                    }}
                    onClick={() =>
                      onChangeAvatarConfig({
                        ...avatarConfig,
                        hoodieColor: c.hex,
                        color: c.hex
                      })
                    }
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Greeting, Next Reminder Hero & Daily Hydration */}
        <div className="dashboard-right-column">
          {/* Hero Greeting & Next Reminder Banner */}
          <div className="hero-reminder-card">
            <div className="hero-header-row">
              <div>
                <div className="hero-top-meta-row">
                  <span className="hero-time-badge">
                    {timeGreetingBadge.icon} {timeGreetingBadge.label}
                  </span>
                  <span className="hero-clock-chip">
                    <span className="clock-pulse"></span>
                    {digitalTimeStr} • {dateStr}
                  </span>
                </div>
                <h2 className="hero-greeting">{greeting}</h2>
                <p className="hero-subtext">
                  Your AI Companion is actively keeping your workflow energized and on schedule.
                </p>
              </div>
              <button className="btn-create-reminder-hero" onClick={onOpenCreateModal}>
                <span className="btn-icon">+</span> New Reminder
              </button>
            </div>

            {/* Next Reminder Box */}
            <div className="next-reminder-focus-box">
              <div className="focus-header-row">
                <span className="focus-label">YOUR NEXT REMINDER</span>
                {nextReminder && (
                  <span className={`countdown-live-pill ${isDueSoon ? "urgent" : ""}`}>
                    <span className="countdown-pulse-dot"></span>
                    {countdownLabel}
                  </span>
                )}
              </div>

              {nextReminder ? (
                <div className="next-reminder-content">
                  <div className="next-reminder-info">
                    <span className={`next-rem-icon ${nextReminder.category}`}>
                      {nextReminder.category === "water"
                        ? "💧"
                        : nextReminder.category === "health"
                        ? "🏃"
                        : "⏰"}
                    </span>
                    <div>
                      <h3 className="next-rem-title">{nextReminder.title}</h3>
                      <div className="next-rem-time-row">
                        <span className="next-rem-time">{formatTime(nextReminder.dueAt)}</span>
                        {nextReminder.repeat && (
                          <span className="repeat-badge">Every {nextReminder.repeat}</span>
                        )}
                        <span className="next-rem-desc-snippet">
                          {nextReminder.description}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="next-rem-actions">
                    <button
                      className="btn-mark-done-hero"
                      onClick={() => onToggleComplete(nextReminder.id)}
                    >
                      <IconCheck size={14} />
                      <span>Mark Done</span>
                    </button>

                    <button
                      className="btn-snooze-hero"
                      onClick={() => onSnoozeReminder(nextReminder.id, 10)}
                    >
                      ⏳ Snooze 10m
                    </button>

                    <button
                      className="btn-test-desktop-hero"
                      onClick={() => onTriggerDesktopAlert(nextReminder)}
                      title="Trigger animated avatar to pop up on desktop right now"
                    >
                      🚀 Test Avatar Popup
                    </button>

                    {isPiPSupported && (
                      <button
                        className={`btn-pip-hero ${isPiPActive ? "active" : ""}`}
                        onClick={onTogglePiP}
                        title="Keep 3D avatar floating on top of all other tabs and applications"
                      >
                        📌 {isPiPActive ? "Avatar Floating (On Screen)" : "Float Over Other Tabs"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="no-reminders-banner">
                  <div className="flex-row items-center gap-2">
                    <span className="sparkle-icon">✨</span>
                    <span>All caught up! No pending tasks right now.</span>
                  </div>
                  <button className="link-btn" onClick={onOpenCreateModal}>
                    Schedule one now →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Daily Hydration Goal Tracker */}
          <div className="hydration-tracker-card">
            <div className="hydration-header">
              <div className="flex-row items-center gap-2">
                <span className="hydration-glass-icon">💧</span>
                <div>
                  <h4 className="hydration-title">Daily Hydration Goal</h4>
                  <p className="hydration-sub">
                    8 glasses daily maintains cognitive clarity & peak energy
                  </p>
                </div>
              </div>
              <div className="hydration-status-group">
                <span className={`hydration-counter-badge ${hydrationCount >= 8 ? "complete" : ""}`}>
                  {hydrationCount} / 8 Glasses ({hydrationPercent}%)
                </span>
              </div>
            </div>

            {/* Fluid animated progress bar */}
            <div className="hydration-bar-track">
              <div
                className="hydration-bar-fill"
                style={{ width: `${hydrationPercent}%` }}
              />
            </div>

            <div className="hydration-glasses-strip">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
                const isFilled = index <= hydrationCount;
                return (
                  <button
                    key={index}
                    className={`glass-node ${isFilled ? "filled" : ""}`}
                    onClick={() =>
                      onIncrementHydration(isFilled ? index - 1 : index)
                    }
                    title={`Glass ${index}: ${isFilled ? "Filled" : "Empty"}`}
                  >
                    <span className="glass-emoji">{isFilled ? "💧" : "○"}</span>
                    <span className="glass-number">{index}</span>
                  </button>
                );
              })}

              <button
                className="btn-add-glass"
                onClick={() => onIncrementHydration(Math.min(8, hydrationCount + 1))}
              >
                + Drank 1 Glass
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Today's Reminders List Card */}
      <div className="panel-card mt-2">
        <div className="panel-card-header justify-between">
          <div className="flex-row items-center gap-2">
            <span className="panel-icon">📋</span>
            <div>
              <h3 className="panel-title">Today's Reminders & Alerts</h3>
              <p className="panel-subtitle">
                Scheduled reminders and health alerts monitored by your 3D Companion
              </p>
            </div>
          </div>

          <div className="flex-row items-center gap-2">
            {/* Filter buttons */}
            <div className="reminder-filter-pills">
              <button
                className={`filter-pill ${reminderFilter === "all" ? "active" : ""}`}
                onClick={() => setReminderFilter("all")}
              >
                All ({reminders.length})
              </button>
              <button
                className={`filter-pill ${reminderFilter === "pending" ? "active" : ""}`}
                onClick={() => setReminderFilter("pending")}
              >
                Pending ({reminders.filter((r) => !r.completed).length})
              </button>
              <button
                className={`filter-pill ${reminderFilter === "completed" ? "active" : ""}`}
                onClick={() => setReminderFilter("completed")}
              >
                Completed ({reminders.filter((r) => r.completed).length})
              </button>
            </div>

            <button
              className="btn-test-water-direct"
              onClick={() =>
                onTriggerDesktopAlert({
                  id: "water-test",
                  title: "Drink Water",
                  description: "💧 Hey! It's time to drink some water.",
                  category: "water"
                })
              }
              title="Test desktop avatar alert immediately"
            >
              💧 Pop-Up Water
            </button>
            <button className="btn-add-reminder-small" onClick={onOpenCreateModal}>
              + Add Reminder
            </button>
          </div>
        </div>

        <div className="reminders-table-view">
          {filteredReminders.length === 0 ? (
            <div className="empty-reminders-box">
              <span className="empty-emoji">⏰</span>
              <h4>No reminders found</h4>
              <p>
                {reminderFilter === "all"
                  ? "Create your first reminder to experience your desktop avatar assistant."
                  : `No ${reminderFilter} reminders right now.`}
              </p>
              <button className="btn-create-reminder-hero mt-3" onClick={onOpenCreateModal}>
                + Create Reminder
              </button>
            </div>
          ) : (
            <div className="reminders-rows-list">
              {filteredReminders.map((rem) => (
                <div
                  key={rem.id}
                  className={`reminder-list-item ${rem.completed ? "is-completed" : ""}`}
                >
                  <div className="item-left">
                    <button
                      className={`item-check-circle ${rem.completed ? "checked" : ""}`}
                      onClick={() => onToggleComplete(rem.id)}
                      title={rem.completed ? "Mark as pending" : "Mark as done"}
                    >
                      {rem.completed ? "✓" : "○"}
                    </button>

                    <div className="item-title-meta">
                      <div className="item-title-line">
                        <span className={`item-name ${rem.completed ? "strikethrough" : ""}`}>
                          {rem.title}
                        </span>
                        {rem.category === "water" ? (
                          <span className="category-pill-water">💧 Water</span>
                        ) : rem.category === "health" ? (
                          <span className="category-pill-health">🏃 Health</span>
                        ) : (
                          <span className="category-pill-work">💼 Task</span>
                        )}
                        {rem.repeat && (
                          <span className="repeat-tag">Every {rem.repeat}</span>
                        )}
                      </div>
                      <span className="item-sub-desc">{rem.description}</span>
                    </div>
                  </div>

                  <div className="item-right-actions">
                    <span className="item-time-badge">{formatTime(rem.dueAt)}</span>

                    <button
                      className="btn-item-test-avatar"
                      onClick={() => onTriggerDesktopAlert(rem)}
                      title="Test this reminder pop-up on desktop"
                    >
                      🤖 Pop Up Avatar
                    </button>

                    <button
                      className="btn-item-delete"
                      onClick={() => onDeleteReminder(rem.id)}
                      title="Delete reminder"
                    >
                      <IconTrash size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
