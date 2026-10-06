import React, { useState } from "react";
import { IconReminders, IconSparkles } from "./Icons";

export function ReminderModal({ isOpen, onClose, onSave }) {
  const [title, setTitle] = useState("Drink Water");
  const [repeat, setRepeat] = useState("1h");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("20:00");
  const [avatarProp, setAvatarProp] = useState("water");
  const [showAvatar, setShowAvatar] = useState(true);
  const [playSound, setPlaySound] = useState(true);
  const [snoozeMinutes, setSnoozeMinutes] = useState(10);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Calculate initial trigger time (e.g. 1 hour or minutes from now)
    let delayMs = 60 * 60 * 1000;
    if (repeat === "30m") delayMs = 30 * 60 * 1000;
    if (repeat === "1h") delayMs = 60 * 60 * 1000;
    if (repeat === "2h") delayMs = 2 * 60 * 60 * 1000;
    if (repeat === "once") delayMs = 15 * 60 * 1000;

    const newReminder = {
      id: "rem-" + Date.now(),
      title: title.trim(),
      description:
        avatarProp === "water"
          ? "Time to drink a fresh glass of water! 💧"
          : avatarProp === "stretch"
          ? "Step away from the screen and stretch! 🧘"
          : avatarProp === "break"
          ? "Time for a relaxing coffee/tea break! ☕"
          : `Scheduled reminder: ${title.trim()}`,
      repeat,
      startTime,
      endTime,
      avatarProp,
      category: avatarProp === "water" ? "water" : "health",
      showAvatar,
      playSound,
      snoozeMinutes,
      dueAt: Date.now() + delayMs,
      completed: false,
      notified: false,
      createdAt: Date.now()
    };

    onSave(newReminder);
    onClose();
  };

  const quickPresets = [
    { name: "Drink Water", prop: "water", repeat: "1h", icon: "💧" },
    { name: "Take a Break", prop: "break", repeat: "1h", icon: "☕" },
    { name: "Stretch & Posture", prop: "stretch", repeat: "2h", icon: "🧘" },
    { name: "Team Meeting", prop: "meeting", repeat: "once", icon: "📅" }
  ];

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="reminder-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-icon">🤖</span>
            <div>
              <h3 className="modal-title">Create Companion Reminder</h3>
              <p className="modal-sub">Configure avatar behavior and schedule intervals</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Quick Presets */}
        <div className="modal-presets-strip">
          <span className="presets-tiny-label">QUICK TEMPLATES:</span>
          <div className="presets-tiny-buttons">
            {quickPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className={`tiny-preset-btn ${title === p.name ? "active" : ""}`}
                onClick={() => {
                  setTitle(p.name);
                  setAvatarProp(p.prop);
                  setRepeat(p.repeat);
                }}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Reminder Name *</label>
            <input
              type="text"
              className="modal-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Drink Water, Stretch, Eye Break"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Repeat Interval</label>
              <select
                className="modal-select"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
              >
                <option value="30m">Every 30 minutes</option>
                <option value="1h">Every 1 hour (Recommended)</option>
                <option value="2h">Every 2 hours</option>
                <option value="daily">Daily at Start Time</option>
                <option value="once">Once (in 15 minutes)</option>
              </select>
            </div>

            <div className="form-group flex-1">
              <label>Avatar Prop & Animation</label>
              <select
                className="modal-select"
                value={avatarProp}
                onChange={(e) => setAvatarProp(e.target.value)}
              >
                <option value="water">💧 Water Bottle (Thirsty/Hydration)</option>
                <option value="break">☕ Coffee Cup (Rest/Break)</option>
                <option value="stretch">🧘 Stretch & Posture</option>
                <option value="meeting">📅 Meeting & Calendar</option>
                <option value="general">⚡ General Alert</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>Active Start Time</label>
              <input
                type="time"
                className="modal-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="form-group flex-1">
              <label>Active End Time</label>
              <input
                type="time"
                className="modal-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div className="form-group flex-1">
              <label>Snooze Option</label>
              <select
                className="modal-select"
                value={snoozeMinutes}
                onChange={(e) => setSnoozeMinutes(parseInt(e.target.value))}
              >
                <option value={10}>10 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>
            </div>
          </div>

          {/* Checkbox Toggles */}
          <div className="modal-checkboxes-row">
            <label className="modal-checkbox-item">
              <input
                type="checkbox"
                checked={showAvatar}
                onChange={(e) => setShowAvatar(e.target.checked)}
              />
              <span>✓ Show Animated Avatar Popup</span>
            </label>

            <label className="modal-checkbox-item">
              <input
                type="checkbox"
                checked={playSound}
                onChange={(e) => setPlaySound(e.target.checked)}
              />
              <span>✓ Notification Sound Cue</span>
            </label>
          </div>

          <div className="modal-actions-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save-reminder">
              <IconSparkles size={15} />
              <span>Save Reminder</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
