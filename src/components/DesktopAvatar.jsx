import React, { useState, useEffect } from "react";
import { IconCheck, IconVolume } from "./Icons";

export function DesktopAvatar({
  mode = "preview", // "alert" (corner overlay) or "preview" (dashboard widget)
  avatarState = "idle", // "idle" | "reminder" | "water" | "completed" | "snoozed" | "alert"
  alertData = null,
  avatarConfig = {
    model: "aerobot",
    color: "#38bdf8",
    name: "Nova"
  },
  onDone = () => {},
  onSnooze = () => {},
  onDismiss = () => {},
  soundEnabled = true
}) {
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [internalState, setInternalState] = useState(avatarState);
  const [speechBubbleText, setSpeechBubbleText] = useState("");

  // Sync state
  useEffect(() => {
    setInternalState(avatarState);
  }, [avatarState]);

  // Determine reminder type and texts
  const isWater =
    internalState === "water" ||
    alertData?.category === "water" ||
    alertData?.title?.toLowerCase().includes("water") ||
    alertData?.title?.toLowerCase().includes("hydrat");

  const effectiveState = internalState === "completed"
    ? "completed"
    : internalState === "snoozed"
    ? "snoozed"
    : isWater
    ? "water"
    : alertData
    ? "reminder"
    : internalState;

  useEffect(() => {
    if (alertData) {
      if (effectiveState === "water") {
        setSpeechBubbleText(alertData.description || "💧 Hey! It's time to drink some water.");
      } else if (effectiveState === "completed") {
        setSpeechBubbleText(isWater ? "Awesome! Hydrated & refreshed! 🌟" : "Task completed! Great job! 🎉");
      } else if (effectiveState === "snoozed") {
        setSpeechBubbleText("Okay! I'll remind you later. 😴");
      } else {
        setSpeechBubbleText(alertData.description || `Hey! Time for: ${alertData.title}`);
      }
    } else {
      if (effectiveState === "water") {
        setSpeechBubbleText("💧 Hey! It's time to drink some water.");
      } else if (effectiveState === "completed") {
        setSpeechBubbleText("Task completed! Great job! 🎉");
      } else if (effectiveState === "snoozed") {
        setSpeechBubbleText("Okay, I'll remind you later. 😴");
      } else if (effectiveState === "alert") {
        setSpeechBubbleText("Important alert: attention needed! ⚠️");
      } else {
        setSpeechBubbleText("All systems nominal! Standing by. ✨");
      }
    }
  }, [alertData, effectiveState, isWater]);

  // Text to Speech playback when alert pops up
  useEffect(() => {
    if (mode === "alert" && alertData && soundEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const speakText = effectiveState === "water"
        ? "Hey! It's time to drink some water."
        : `Reminder: ${alertData.title}`;
      const utterance = new SpeechSynthesisUtterance(speakText);
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  }, [mode, alertData, effectiveState, soundEnabled]);

  const handleSpeak = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const clean = speechBubbleText.replace(/[*_~`]/g, "");
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDoneClick = () => {
    setInternalState("completed");
    onDone(alertData?.id);
  };

  const handleSnoozeSelect = (minutes) => {
    setInternalState("snoozed");
    setShowSnoozeOptions(false);
    setTimeout(() => {
      onSnooze(alertData?.id, minutes);
    }, 1200);
  };

  const color = avatarConfig?.color || "#38bdf8";

  return (
    <div className={`avatar-companion-container mode-${mode} state-${effectiveState}`}>
      {/* Speech Bubble */}
      {(mode === "alert" || effectiveState !== "idle") && (
        <div className={`companion-speech-bubble state-${effectiveState}`}>
          <div className="speech-bubble-tag">
            <span className="speech-avatar-dot" style={{ backgroundColor: color }}></span>
            <span className="speech-avatar-name">{avatarConfig.name || "Companion"}</span>
            <button className="speech-tts-icon-btn" onClick={handleSpeak} title="Play audio">
              <IconVolume size={13} />
            </button>
          </div>

          <div className="speech-bubble-body">
            <p className="speech-bubble-text">{speechBubbleText}</p>
          </div>

          {/* Action buttons (only in alert mode when not completed or snoozed) */}
          {mode === "alert" && effectiveState !== "completed" && effectiveState !== "snoozed" && (
            <div className="speech-bubble-actions">
              <button className="bubble-btn-done" onClick={handleDoneClick}>
                <IconCheck size={14} />
                <span>Done</span>
              </button>

              <div className="snooze-dropdown-wrap">
                <button
                  className="bubble-btn-later"
                  onClick={() => setShowSnoozeOptions((prev) => !prev)}
                >
                  <span>Remind me later ▾</span>
                </button>

                {showSnoozeOptions && (
                  <div className="snooze-menu">
                    <button onClick={() => handleSnoozeSelect(10)}>In 10 minutes</button>
                    <button onClick={() => handleSnoozeSelect(30)}>In 30 minutes</button>
                    <button onClick={() => handleSnoozeSelect(60)}>In 1 hour</button>
                  </div>
                )}
              </div>

              <button className="bubble-btn-dismiss" onClick={onDismiss} title="Dismiss">
                ✕
              </button>
            </div>
          )}

          {/* Celebration confetti particles */}
          {effectiveState === "completed" && (
            <div className="avatar-celebration-particles">
              <span className="p1">🎉</span>
              <span className="p2">💧</span>
              <span className="p3">⭐</span>
              <span className="p4">✨</span>
            </div>
          )}

          {/* Sleepy Zzz for snoozed */}
          {effectiveState === "snoozed" && (
            <div className="avatar-snooze-bubbles">
              <span className="z1">z</span>
              <span className="z2">Z</span>
              <span className="z3">Z</span>
            </div>
          )}

          <div className="speech-bubble-tail"></div>
        </div>
      )}

      {/* 3D/Cartoon Animated Avatar Character */}
      <div className="avatar-character-stage">
        {/* Holographic floor ring */}
        <div className="avatar-holo-platform" style={{ boxShadow: `0 0 16px ${color}66` }}></div>

        <div className={`avatar-robot-body state-${effectiveState}`}>
          {/* Head & Antenna */}
          <div className="robot-head">
            <div className="robot-antenna">
              <span
                className="antenna-bulb"
                style={{
                  backgroundColor: effectiveState === "alert" ? "#f59e0b" : color,
                  boxShadow: `0 0 10px ${effectiveState === "alert" ? "#f59e0b" : color}`
                }}
              ></span>
            </div>

            {/* Cute Ear pods */}
            <div className="robot-ear ear-left" style={{ borderColor: color }}></div>
            <div className="robot-ear ear-right" style={{ borderColor: color }}></div>

            {/* Digital OLED Visor Screen */}
            <div className="robot-visor">
              <div className="visor-glare"></div>

              {/* Expressive Visor Eyes */}
              <div className={`robot-eyes-display eyes-${effectiveState}`}>
                {effectiveState === "completed" ? (
                  // Happy curved smiling eyes
                  <div className="eyes-happy-pair">
                    <span className="curved-eye" style={{ borderTopColor: color }}></span>
                    <span className="curved-eye" style={{ borderTopColor: color }}></span>
                  </div>
                ) : effectiveState === "snoozed" ? (
                  // Sleepy horizontal bar eyes
                  <div className="eyes-sleepy-pair">
                    <span className="sleepy-bar" style={{ backgroundColor: color }}></span>
                    <span className="sleepy-bar" style={{ backgroundColor: color }}></span>
                  </div>
                ) : effectiveState === "water" ? (
                  // Thirsty / wide watering eyes
                  <div className="eyes-thirsty-pair">
                    <span className="thirsty-eye" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}>
                      <span className="pupil-droplet">💧</span>
                    </span>
                    <span className="thirsty-eye" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}>
                      <span className="pupil-droplet">💧</span>
                    </span>
                  </div>
                ) : effectiveState === "alert" ? (
                  // Attentive alert eyes
                  <div className="eyes-alert-pair">
                    <span className="alert-eye" style={{ backgroundColor: "#f59e0b", boxShadow: "0 0 10px #f59e0b" }}></span>
                    <span className="alert-eye" style={{ backgroundColor: "#f59e0b", boxShadow: "0 0 10px #f59e0b" }}></span>
                  </div>
                ) : (
                  // Idle / Reminder blinking eyes
                  <div className="eyes-normal-pair">
                    <span className="normal-eye" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}></span>
                    <span className="normal-eye" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Robot Torso & Chest Core */}
          <div className="robot-torso">
            <div
              className="reactor-core"
              style={{
                borderColor: color,
                boxShadow: `0 0 10px ${color}88`
              }}
            >
              {effectiveState === "water" ? (
                <span className="core-icon">💧</span>
              ) : effectiveState === "completed" ? (
                <span className="core-icon">⭐</span>
              ) : effectiveState === "snoozed" ? (
                <span className="core-icon">💤</span>
              ) : (
                <span className="core-icon">⚡</span>
              )}
            </div>

            {/* Left Arm */}
            <div className="robot-arm arm-left"></div>

            {/* Right Arm (Waving or Holding Props) */}
            <div className={`robot-arm arm-right ${effectiveState === "water" ? "holding-prop" : "waving"}`}>
              {effectiveState === "water" ? (
                <div className="prop-water-bottle" title="Drink Water">
                  <span className="bottle-icon">🥤</span>
                  <span className="water-drop-sparkle">💧</span>
                </div>
              ) : effectiveState === "completed" ? (
                <div className="prop-thumbs-up">👍</div>
              ) : (
                <div className="robot-hand">👋</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
