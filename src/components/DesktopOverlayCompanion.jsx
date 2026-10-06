import React, { useState, useEffect, useRef } from "react";
import { VirtualHuman3D } from "./VirtualHuman3D";
import { IconCheck, IconVolume } from "./Icons";
import { desktopService } from "../services/desktopService";

export function DesktopOverlayCompanion({
  reminder = null,
  onFinish = () => {},
  soundEnabled = true,
  characterConfig
}) {
  const [animState, setAnimState] = useState("walk_in");
  const [speechBubbleText, setSpeechBubbleText] = useState("Hey! 👋");
  const [showButtons, setShowButtons] = useState(false);
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const activeReminder = reminder || {
    id: "rem-water",
    title: "Drink Water",
    category: "water",
    promptText: "Did you drink water?"
  };

  const isWater =
    activeReminder.category === "water" ||
    activeReminder.title?.toLowerCase().includes("water");

  // Step 1: When walk-in finishes, wave and say "Hey! 👋"
  const handleAnimComplete = (eventName) => {
    if (eventName === "walk_in_arrived") {
      setAnimState("wave");
      setSpeechBubbleText("Hey! 👋");

      if (soundEnabled && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance("Hey!");
        u.rate = 1.05;
        u.pitch = 1.08;
        window.speechSynthesis.speak(u);
      }

      // After 1.4 seconds of waving, ask the reminder question
      setTimeout(() => {
        const question = isWater
          ? "Did you drink water?"
          : `Ready for: ${activeReminder.title}?`;

        setSpeechBubbleText(question);
        setShowButtons(true);
        setAnimState("idle");

        if (soundEnabled && "speechSynthesis" in window) {
          const u2 = new SpeechSynthesisUtterance(isWater ? "Did you drink water?" : activeReminder.title);
          u2.rate = 1.05;
          u2.pitch = 1.08;
          window.speechSynthesis.speak(u2);
        }
      }, 1400);
    } else if (eventName === "walk_away_finished") {
      // Disappear from desktop
      desktopService.hideOverlay();
      onFinish();
    }
  };

  // User clicks YES
  const handleYes = () => {
    setShowButtons(false);
    setIsDone(true);
    setAnimState("drink"); // Raises bottle, smiles, gives thumbs-up

    const confirmText = isWater ? "Nice! Stay hydrated 💧" : "Awesome job! 👍";
    setSpeechBubbleText(confirmText);

    if (soundEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(confirmText);
      u.rate = 1.05;
      u.pitch = 1.1;
      window.speechSynthesis.speak(u);
    }

    // Celebrate for 2 seconds, then turn and walk away
    setTimeout(() => {
      setAnimState("walk_away");
    }, 2200);
  };

  // User clicks REMIND ME LATER
  const handleLater = (minutes = 10) => {
    setShowButtons(false);
    setShowSnoozeOptions(false);
    setAnimState("snooze");

    setSpeechBubbleText(`Okay, I'll remind you in ${minutes}m. ⏳`);

    if (soundEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("Okay, I'll remind you later.");
      u.rate = 1.05;
      window.speechSynthesis.speak(u);
    }

    setTimeout(() => {
      setAnimState("walk_away");
    }, 1800);
  };

  return (
    <div className="desktop-overlay-wrapper">
      {/* Speech Bubble floating naturally beside/above the 3D human character */}
      <div className={`overlay-human-speech-bubble ${isDone ? "bubble-celebrating" : ""}`}>
        <div className="overlay-bubble-header">
          <div className="companion-name-badge">
            <span className="live-pulse-dot"></span>
            <span>Virtual Companion</span>
          </div>
        </div>

        <p className="overlay-bubble-text">{speechBubbleText}</p>

        {showButtons && (
          <div className="overlay-bubble-actions">
            <button className="overlay-btn-yes" onClick={handleYes}>
              <IconCheck size={14} />
              <span>YES</span>
            </button>

            <div className="overlay-snooze-wrapper">
              <button
                className="overlay-btn-later"
                onClick={() => setShowSnoozeOptions((prev) => !prev)}
              >
                <span>REMIND ME LATER ▾</span>
              </button>

              {showSnoozeOptions && (
                <div className="overlay-snooze-dropdown">
                  <button onClick={() => handleLater(10)}>10 minutes</button>
                  <button onClick={() => handleLater(30)}>30 minutes</button>
                  <button onClick={() => handleLater(60)}>1 hour</button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="overlay-bubble-tail"></div>
      </div>

      {/* 3D Animated Virtual Human Companion */}
      <div className="overlay-3d-character-stage">
        <VirtualHuman3D
          animationState={animState}
          onAnimationComplete={handleAnimComplete}
          characterConfig={characterConfig}
          width={380}
          height={480}
        />
      </div>
    </div>
  );
}
