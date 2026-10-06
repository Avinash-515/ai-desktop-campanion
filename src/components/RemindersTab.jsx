import React, { useState, useEffect } from "react";
import { IconReminders, IconTrash, IconCheck } from "./Icons";
import { desktopService } from "../services/desktopService";

export function RemindersTab({
  reminders,
  onAddReminder,
  onToggleComplete,
  onDeleteReminder,
  onClearCompleted,
  onAddToast,
  soundService,
  soundEnabled,
  onTriggerAvatarAlert,
  isPiPSupported,
  isPiPActive,
  onTogglePiP
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState(15);
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("work");
  const [filter, setFilter] = useState("active"); // 'active', 'completed', 'all'
  const [, setTick] = useState(0);

  // Tick every 1 second to update remaining countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTestAvatarWater = () => {
    if (onTriggerAvatarAlert) {
      onTriggerAvatarAlert({
        title: "Drink Water Reminder",
        description: "Hey! Time to drink a refreshing glass of water 💧 Staying hydrated keeps your mind sharp and your body energized!",
        category: "health",
        priority: "medium"
      });
    }
  };

  const handleCreate = (e) => {
    e?.preventDefault();
    if (!title.trim()) {
      onAddToast({ type: "warning", title: "Missing Title", message: "Please provide a reminder title." });
      return;
    }

    const dueAt = Date.now() + minutes * 60 * 1000;
    const newRem = {
      id: "rem-" + Date.now(),
      title: title.trim(),
      description: description.trim(),
      minutes,
      priority,
      category,
      dueAt,
      completed: false,
      notified: false,
      createdAt: Date.now()
    };

    onAddReminder(newRem);
    setTitle("");
    setDescription("");
    onAddToast({
      type: "success",
      title: "Reminder Scheduled",
      message: `"${newRem.title}" in ${minutes} minutes`
    });
  };

  const handleQuickAdd = (presetMinutes, presetTitle, presetCategory, presetPriority) => {
    const dueAt = Date.now() + presetMinutes * 60 * 1000;
    const newRem = {
      id: "rem-" + Date.now(),
      title: presetTitle,
      description: `Preset timer scheduled for ${presetMinutes} minutes.`,
      minutes: presetMinutes,
      priority: presetPriority || "medium",
      category: presetCategory || "focus",
      dueAt,
      completed: false,
      notified: false,
      createdAt: Date.now()
    };

    onAddReminder(newRem);
    onAddToast({
      type: "success",
      title: "Quick Timer Set",
      message: `${presetTitle} in ${presetMinutes}m`
    });
  };

  const filteredReminders = reminders.filter((r) => {
    if (filter === "active") return !r.completed;
    if (filter === "completed") return r.completed;
    return true;
  });

  const activeCount = reminders.filter((r) => !r.completed).length;

  return (
    <div className="tab-page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">Desktop Reminders & Focus Timers</h2>
          <p className="page-subtitle">
            Schedule timers with animated avatar popups, speech dialogs, and audio alerts.
          </p>
        </div>

        <div className="filter-pill-group">
          <button
            className={`filter-pill ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}
          >
            Active ({activeCount})
          </button>
          <button
            className={`filter-pill ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completed ({reminders.length - activeCount})
          </button>
          <button
            className={`filter-pill ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({reminders.length})
          </button>
        </div>
      </div>

      {isPiPSupported && (
        <div className="reminders-pip-banner">
          <div className="flex-row items-center gap-2">
            <span className="pip-banner-icon">📌</span>
            <div className="pip-banner-text-wrap">
              <span className="pip-banner-title">Keep Avatar Floating Over Other Tabs:</span>
              <span className="pip-banner-desc">
                When switching to other browser tabs (YouTube, Docs, Google), float the 3D Avatar in an Always-On-Top window so your reminders never get missed!
              </span>
            </div>
          </div>
          <button
            className={`btn-pip-banner ${isPiPActive ? "active" : ""}`}
            onClick={onTogglePiP}
          >
            {isPiPActive ? "📌 Avatar Floating (Active)" : "📌 Float Avatar Now"}
          </button>
        </div>
      )}

      {/* Quick Schedule Presets */}
      <div className="presets-bar">
        <span className="presets-label">QUICK TIMERS:</span>
        <button
          className="preset-chip water-chip"
          onClick={() => handleQuickAdd(20, "Drink a glass of water 💧", "health", "medium")}
        >
          💧 +20m Drink Water
        </button>
        <button
          className="preset-chip"
          onClick={() => handleQuickAdd(10, "Take a 10-minute walk / eye break", "health", "low")}
        >
          ☕ +10m Break
        </button>
        <button
          className="preset-chip"
          onClick={() => handleQuickAdd(25, "Pomodoro Focus Sprint Complete", "focus", "medium")}
        >
          🍅 +25m Pomodoro
        </button>
        <button
          className="preset-chip"
          onClick={() => handleQuickAdd(45, "Code Review & Git Commit", "work", "high")}
        >
          💻 +45m Code Review
        </button>
        <button
          className="preset-chip test-avatar-chip"
          onClick={handleTestAvatarWater}
          title="See how your companion avatar pops up to remind you to drink water"
        >
          🤖 Preview Avatar Alert Now
        </button>
      </div>

      <div className="two-col-layout">
        {/* Creation Form */}
        <div className="panel-card">
          <div className="panel-card-header">
            <span className="panel-icon">⏰</span>
            <div>
              <h3 className="panel-title">Schedule New Reminder</h3>
              <p className="panel-subtitle">Set title, duration, and priority level.</p>
            </div>
          </div>

          <form className="reminder-form" onSubmit={handleCreate}>
            <div className="form-group">
              <label>Reminder Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Test release build, Standup meeting, Push code"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Optional Notes / Details</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Check PR comments on repo"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Trigger In (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="1440"
                  className="form-input"
                  value={minutes}
                  onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div className="form-group flex-1">
                <label>Priority</label>
                <select
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (Urgent)</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label>Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="work">Work</option>
                  <option value="focus">Focus</option>
                  <option value="health">Health</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
            </div>

            <button type="submit" className="submit-reminder-btn">
              <IconReminders size={16} />
              <span>Schedule Reminder</span>
            </button>
          </form>
        </div>

        {/* Reminders List */}
        <div className="panel-card flex-col">
          <div className="panel-card-header justify-between">
            <div className="flex-row items-center gap-2">
              <span className="panel-icon">📋</span>
              <h3 className="panel-title">Active Timers</h3>
            </div>
            {reminders.some((r) => r.completed) && (
              <button className="clear-text-btn" onClick={onClearCompleted}>
                Clear Completed
              </button>
            )}
          </div>

          <div className="reminders-scroll-list">
            {filteredReminders.length === 0 ? (
              <div className="empty-reminders-state">
                <span>⏱️</span>
                <p>No reminders in this view. Use the form or quick timers to create one.</p>
              </div>
            ) : (
              filteredReminders.map((rem) => {
                const remainingMs = rem.dueAt - Date.now();
                const isOverdue = remainingMs <= 0;
                const formattedCountdown = formatCountdown(remainingMs);

                return (
                  <div
                    key={rem.id}
                    className={`reminder-card ${rem.completed ? "completed" : ""} ${isOverdue && !rem.completed ? "overdue" : ""}`}
                  >
                    <div className="reminder-left">
                      <button
                        className={`check-toggle-btn ${rem.completed ? "checked" : ""}`}
                        onClick={() => onToggleComplete(rem.id)}
                        title={rem.completed ? "Mark as active" : "Mark as completed"}
                      >
                        {rem.completed && <IconCheck size={12} />}
                      </button>

                      <div className="reminder-info">
                        <div className="reminder-title-row">
                          <span className={`reminder-title ${rem.completed ? "line-through" : ""}`}>
                            {rem.title}
                          </span>
                          <span className={`priority-tag priority-${rem.priority}`}>
                            {rem.priority}
                          </span>
                          <span className="category-tag">{rem.category}</span>
                        </div>

                        {rem.description && (
                          <div className="reminder-desc">{rem.description}</div>
                        )}

                        <div className="reminder-time-meta">
                          {!rem.completed ? (
                            <span className={`countdown-badge ${isOverdue ? "badge-overdue" : ""}`}>
                              {isOverdue ? "🔔 Triggered / Due Now" : `⏳ ${formattedCountdown}`}
                            </span>
                          ) : (
                            <span className="countdown-badge badge-done">✓ Completed</span>
                          )}
                          <span className="created-text">
                            Scheduled at {new Date(rem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      className="delete-rem-btn"
                      onClick={() => onDeleteReminder(rem.id)}
                      title="Delete Reminder"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatCountdown(ms) {
  if (ms <= 0) return "Due Now";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}
