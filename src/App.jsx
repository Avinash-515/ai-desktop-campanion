import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardTab } from "./components/DashboardTab";
import { ChatTab } from "./components/ChatTab";
import { ApplicationsTab } from "./components/ApplicationsTab";
import { FilesTab } from "./components/FilesTab";
import { DocumentsTab } from "./components/DocumentsTab";
import { RemindersTab } from "./components/RemindersTab";
import { SettingsTab } from "./components/SettingsTab";
import { ToastContainer } from "./components/ToastContainer";
import { AvatarAlert } from "./components/AvatarAlert";
import { ReminderModal } from "./components/ReminderModal";
import { DesktopOverlayCompanion } from "./components/DesktopOverlayCompanion";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { desktopService } from "./services/desktopService";
import { aiEngine, PERSONALITIES } from "./services/aiEngine";
import { soundService } from "./services/soundService";
import "./App.css";

const TAB_TITLES = {
  dashboard: "Companion Dashboard",
  chat: "Interactive Assistant",
  apps: "Applications Launcher",
  files: "Desktop Files Explorer",
  documents: "Document Intelligence",
  reminders: "Reminders & Timers",
  settings: "Settings & Hardware"
};

// Check if current window instance is the transparent Desktop Overlay
const isOverlayMode =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("mode") === "overlay";

// -------------------------------------------------------------
// Transparent Desktop Overlay Companion Window
// -------------------------------------------------------------
function OverlayApp() {
  const [reminder, setReminder] = useState(() => ({
    id: "rem-water",
    title: "Drink Water",
    category: "water",
    description: "💧 Time to drink a fresh glass of water!"
  }));
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    document.body.classList.add("overlay-mode");
    document.documentElement.classList.add("overlay-mode");

    desktopService.onShowAvatar((data) => {
      if (data) {
        setReminder(data);
      }
      setAnimKey((k) => k + 1);
    });
  }, []);

  return (
    <div className="overlay-root-transparent">
      <DesktopOverlayCompanion
        key={animKey}
        reminder={reminder}
        onFinish={() => {
          desktopService.hideOverlay();
        }}
        soundEnabled={true}
      />
    </div>
  );
}

// -------------------------------------------------------------
// Main Dashboard & Companion Workspace
// -------------------------------------------------------------
function MainApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [appInfo, setAppInfo] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [isThinking, setIsThinking] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [loadedDoc, setLoadedDoc] = useState(null);
  const [avatarAlert, setAvatarAlert] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pipWindow, setPipWindow] = useState(null);

  // Hydration state
  const [hydrationCount, setHydrationCount] = useState(() => {
    const val = localStorage.getItem("companion_hydration");
    return val !== null ? parseInt(val, 10) : 3;
  });

  // Avatar Customization State
  const [avatarConfig, setAvatarConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("companion_avatar_cfg");
      return saved
        ? JSON.parse(saved)
        : {
            gender: "casual",
            color: "#38bdf8",
            hoodieColor: "#2563eb",
            jeansColor: "#1e293b",
            skinTone: "#f5d0b0",
            hairColor: "#27272a"
          };
    } catch {
      return {
        gender: "casual",
        color: "#38bdf8",
        hoodieColor: "#2563eb",
        jeansColor: "#1e293b",
        skinTone: "#f5d0b0",
        hairColor: "#27272a"
      };
    }
  });

  // Settings State with LocalStorage Persistence
  const [personaKey, setPersonaKey] = useState(() => localStorage.getItem("companion_persona") || "nova");
  const [companionName, setCompanionName] = useState(() => localStorage.getItem("companion_name") || "Nova");
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem("companion_gemini_key") || "");
  const [geminiModel, setGeminiModel] = useState(() => localStorage.getItem("companion_gemini_model") || "gemini-2.5-flash");
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("companion_sound") !== "false");
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem("companion_notifs") !== "false");
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem("companion_accent") || "blue");

  // Messages with LocalStorage Persistence
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("companion_messages");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Initial Reminders with LocalStorage Persistence
  const [reminders, setReminders] = useState(() => {
    try {
      const saved = localStorage.getItem("companion_reminders");
      if (saved) return JSON.parse(saved);
      // Default initial drink water reminder if brand new
      return [
        {
          id: "rem-default-water",
          title: "Drink Water",
          description: "💧 Hey! It's time to drink some water.",
          category: "water",
          repeat: "1h",
          startTime: "09:00",
          endTime: "21:00",
          avatarProp: "water",
          dueAt: Date.now() + 45 * 60 * 1000,
          completed: false,
          notified: false,
          createdAt: Date.now()
        },
        {
          id: "rem-default-break",
          title: "Take a Break & Stretch",
          description: "Step away from screen and relax your eyes.",
          category: "health",
          repeat: "90m",
          startTime: "09:00",
          endTime: "20:00",
          avatarProp: "stretch",
          dueAt: Date.now() + 90 * 60 * 1000,
          completed: false,
          notified: false,
          createdAt: Date.now()
        }
      ];
    } catch {
      return [];
    }
  });

  // Toast Helper
  const addToast = useCallback((toast) => {
    const id = "toast-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Picture-in-Picture Floating Window Manager
  const togglePiP = useCallback(async () => {
    if (pipWindow) {
      try {
        pipWindow.close();
      } catch {
        // ignore
      }
      setPipWindow(null);
      return;
    }

    if (!desktopService.isPiPSupported()) {
      addToast({
        type: "info",
        title: "Picture-in-Picture",
        message: "Document Picture-in-Picture is supported in Chrome & Edge browsers."
      });
      return;
    }

    try {
      const win = await window.documentPictureInPicture.requestWindow({
        width: 340,
        height: 480
      });

      // Transfer active stylesheets so 3D avatar & bubble match the main window
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join("");
          const style = win.document.createElement("style");
          style.textContent = cssRules;
          win.document.head.appendChild(style);
        } catch {
          if (styleSheet.href) {
            const link = win.document.createElement("link");
            link.rel = "stylesheet";
            link.href = styleSheet.href;
            win.document.head.appendChild(link);
          }
        }
      });

      win.document.body.style.margin = "0";
      win.document.body.style.background = "#080d1a";
      win.document.body.style.overflow = "hidden";
      win.document.title = `${companionName} • Floating Companion`;

      win.addEventListener("pagehide", () => {
        setPipWindow(null);
      });

      setPipWindow(win);

      addToast({
        type: "success",
        title: "Avatar Floating On Screen",
        message: "Your 3D companion stays visible on top of all other tabs and apps!"
      });
    } catch (err) {
      console.warn("Failed to open PiP window:", err);
      addToast({
        type: "error",
        title: "Floating Window Error",
        message: err.message || "Could not open floating window"
      });
    }
  }, [pipWindow, companionName, addToast]);

  // Sync state to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("companion_persona", personaKey);
      localStorage.setItem("companion_name", companionName);
      localStorage.setItem("companion_gemini_key", geminiApiKey);
      localStorage.setItem("companion_gemini_model", geminiModel);
      localStorage.setItem("companion_sound", String(soundEnabled));
      localStorage.setItem("companion_notifs", String(notificationsEnabled));
      localStorage.setItem("companion_accent", accentColor);
      localStorage.setItem("companion_messages", JSON.stringify(messages.slice(-50)));
      localStorage.setItem("companion_reminders", JSON.stringify(reminders));
      localStorage.setItem("companion_hydration", String(hydrationCount));
      localStorage.setItem("companion_avatar_cfg", JSON.stringify(avatarConfig));
    } catch {
      // ignore storage quota issues
    }
  }, [
    personaKey,
    companionName,
    geminiApiKey,
    geminiModel,
    soundEnabled,
    notificationsEnabled,
    accentColor,
    messages,
    reminders,
    hydrationCount,
    avatarConfig
  ]);

  // Load App Info and System Telemetry
  const refreshStats = useCallback(async () => {
    try {
      const stats = await desktopService.getSystemStats();
      setSystemStats(stats);
    } catch (err) {
      console.warn("Failed to fetch system stats:", err);
    }
  }, []);

  useEffect(() => {
    desktopService.getAppInfo().then(setAppInfo).catch(() => {});
    refreshStats();

    // Poll system stats every 8 seconds
    const interval = setInterval(refreshStats, 8000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  // Reminders Watcher & Tab Visibility Listener: checks every second and syncs immediately on tab switch
  useEffect(() => {
    let titleInterval = null;
    const originalTitle = "AI Desktop Companion";

    const checkDueReminders = () => {
      const now = Date.now();
      setReminders((prevReminders) => {
        let changed = false;
        let dueItem = null;
        const updated = prevReminders.map((r) => {
          if (!r.completed && !r.notified && r.dueAt <= now) {
            changed = true;
            dueItem = r;
            // 1. Trigger the 3D Avatar overlay onto the desktop
            desktopService.triggerOverlay({
              id: r.id,
              title: r.title,
              description: r.description,
              category: r.category
            });

            // 2. Corner avatar alert fallback
            setAvatarAlert({
              reminderId: r.id,
              title: r.title,
              description: r.description,
              category: r.category,
              priority: r.priority
            });

            if (notificationsEnabled) {
              desktopService.sendNotification(
                `⏰ ${r.title}`,
                r.description || "Your AI Companion has a message for you!"
              );
            }
            if (soundEnabled) {
              soundService.playReminder();
            }

            return { ...r, notified: true, completed: true };
          }
          return r;
        });

        // If a reminder triggered while user is in another browser tab, flash tab title
        if (dueItem && document.hidden) {
          if (!titleInterval) {
            let toggle = false;
            titleInterval = setInterval(() => {
              document.title = toggle
                ? `🚨 TIME FOR: ${dueItem.title.toUpperCase()}!`
                : `⏰ [COMPANION ALERT] Click to Return`;
              toggle = !toggle;
            }, 1000);
          }
        }

        return changed ? updated : prevReminders;
      });
    };

    const timer = setInterval(checkDueReminders, 1000);

    // Sync immediately when returning to tab from another browser tab / minimizing
    const handleVisibilitySync = () => {
      if (!document.hidden) {
        if (titleInterval) {
          clearInterval(titleInterval);
          titleInterval = null;
          document.title = originalTitle;
        }
        checkDueReminders();
        refreshStats();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilitySync);
    window.addEventListener("focus", handleVisibilitySync);

    return () => {
      clearInterval(timer);
      if (titleInterval) {
        clearInterval(titleInterval);
        document.title = originalTitle;
      }
      document.removeEventListener("visibilitychange", handleVisibilitySync);
      window.removeEventListener("focus", handleVisibilitySync);
    };
  }, [notificationsEnabled, soundEnabled, refreshStats]);

  // Send Message & Process Query
  const handleSendMessage = async (text) => {
    if (!text.trim() || isThinking) return;

    if (soundEnabled) {
      soundService.playSend();
    }

    const userMsg = {
      id: "msg-" + Date.now(),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const response = await aiEngine.processQuery({
        prompt: text,
        history: messages,
        personaKey,
        geminiApiKey,
        geminiModel,
        systemStats
      });

      if (soundEnabled) {
        soundService.playReceive();
      }

      const botMsg = {
        id: "msg-" + (Date.now() + 1),
        sender: "bot",
        text: response.text,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        action: response.action
      };

      setMessages((prev) => [...prev, botMsg]);

      // Automatically execute actions if appropriate
      if (response.action) {
        if (response.action.type === "LAUNCH_APP") {
          desktopService.launchApp(response.action.target).then((res) => {
            addToast({
              type: res.success ? "success" : "error",
              title: response.action.label || "Application",
              message: res.message || "Executed launch command"
            });
          });
        } else if (response.action.type === "CREATE_REMINDER") {
          const minutes = response.action.minutes || 15;
          const newRem = {
            id: "rem-" + Date.now(),
            title: response.action.title,
            description: `Scheduled via chat conversation.`,
            minutes,
            priority: "medium",
            category: "work",
            dueAt: Date.now() + minutes * 60 * 1000,
            completed: false,
            notified: false,
            createdAt: Date.now()
          };
          setReminders((prev) => [newRem, ...prev]);
          addToast({
            type: "success",
            title: "Reminder Scheduled",
            message: `"${newRem.title}" in ${minutes}m`
          });
        }
      }
    } catch (err) {
      const botErrMsg = {
        id: "msg-" + (Date.now() + 1),
        sender: "bot",
        text: `I encountered an unexpected error: ${err.message}. Please try again.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, botErrMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem("companion_messages");
    addToast({ type: "info", title: "Conversation Cleared", message: "Chat history has been reset." });
  };

  const handleAnalyzeDocument = (doc) => {
    setLoadedDoc(doc);
    setActiveTab("documents");
  };

  const handleAskCompanion = (prompt) => {
    setActiveTab("chat");
    setTimeout(() => {
      handleSendMessage(prompt);
    }, 150);
  };

  const currentPersona = PERSONALITIES[personaKey] || PERSONALITIES.nova;
  const pendingRemindersCount = reminders.filter((r) => !r.completed).length;

  return (
    <div className={`app theme-accent-${accentColor}`}>
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingRemindersCount={pendingRemindersCount}
        systemStats={systemStats}
        appInfo={appInfo}
      />

      <main className="main-content-layout">
        <Header
          activeTab={activeTab}
          tabTitles={TAB_TITLES}
          systemStats={systemStats}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          persona={currentPersona}
          isElectron={desktopService.isElectron()}
          isPiPSupported={desktopService.isPiPSupported()}
          isPiPActive={Boolean(pipWindow)}
          onTogglePiP={togglePiP}
        />

        <div className="tab-render-container">
          <div
            className={`tab-panel-wrapper ${activeTab === "dashboard" ? "active" : "inactive"}`}
            role="tabpanel"
            aria-hidden={activeTab !== "dashboard"}
          >
            <DashboardTab
              reminders={reminders}
              onAddReminder={(rem) => setReminders((prev) => [rem, ...prev])}
              onToggleComplete={(id) =>
                setReminders((prev) =>
                  prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
                )
              }
              onDeleteReminder={(id) =>
                setReminders((prev) => prev.filter((r) => r.id !== id))
              }
              onSnoozeReminder={(id, minutes) => {
                setReminders((prev) =>
                  prev.map((r) =>
                    r.id === id
                      ? { ...r, dueAt: Date.now() + minutes * 60 * 1000, notified: false, completed: false }
                      : r
                  )
                );
                addToast({
                  type: "info",
                  title: "Reminder Snoozed",
                  message: `Snoozed for ${minutes} minutes`
                });
              }}
              onTriggerDesktopAlert={(rem) => {
                desktopService.triggerOverlay(rem);
                setAvatarAlert({ ...rem, reminderId: rem.id || "test-rem" });
                addToast({
                  type: "info",
                  title: "Desktop Avatar Walk-In",
                  message: `3D Companion is appearing to remind you: "${rem.title}"`
                });
              }}
              avatarConfig={avatarConfig}
              onChangeAvatarConfig={setAvatarConfig}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              hydrationCount={hydrationCount}
              onIncrementHydration={(count) => {
                setHydrationCount(count);
                if (count >= 8) {
                  addToast({
                    type: "success",
                    title: "🎉 Goal Achieved!",
                    message: "You completed your 8-glass daily hydration target!"
                  });
                }
              }}
              isPiPSupported={desktopService.isPiPSupported()}
              isPiPActive={Boolean(pipWindow)}
              onTogglePiP={togglePiP}
            />
          </div>

          <div
            className={`tab-panel-wrapper ${activeTab === "chat" ? "active" : "inactive"}`}
            role="tabpanel"
            aria-hidden={activeTab !== "chat"}
          >
            <ChatTab
              messages={messages}
              onSendMessage={handleSendMessage}
              isThinking={isThinking}
              persona={currentPersona}
              onSelectTab={setActiveTab}
              onClearChat={handleClearChat}
              onAddToast={addToast}
              soundEnabled={soundEnabled}
              systemStats={systemStats}
            />
          </div>

          <div
            className={`tab-panel-wrapper ${activeTab === "apps" ? "active" : "inactive"}`}
            role="tabpanel"
            aria-hidden={activeTab !== "apps"}
          >
            <ApplicationsTab
              onAddToast={addToast}
              soundService={soundService}
              soundEnabled={soundEnabled}
            />
          </div>

          <div
            className={`tab-panel-wrapper ${activeTab === "files" ? "active" : "inactive"}`}
            role="tabpanel"
            aria-hidden={activeTab !== "files"}
          >
            <FilesTab
              onAddToast={addToast}
              onAnalyzeDocument={handleAnalyzeDocument}
              onAskCompanion={handleAskCompanion}
            />
          </div>

          <div
            className={`tab-panel-wrapper ${activeTab === "documents" ? "active" : "inactive"}`}
            role="tabpanel"
            aria-hidden={activeTab !== "documents"}
          >
            <DocumentsTab
              loadedDoc={loadedDoc}
              onAddToast={addToast}
              onAskCompanion={handleAskCompanion}
              geminiApiKey={geminiApiKey}
              geminiModel={geminiModel}
            />
          </div>

          <div
            className={`tab-panel-wrapper ${activeTab === "reminders" ? "active" : "inactive"}`}
            role="tabpanel"
            aria-hidden={activeTab !== "reminders"}
          >
            <RemindersTab
              reminders={reminders}
              onAddReminder={(rem) => setReminders((prev) => [rem, ...prev])}
              onToggleComplete={(id) =>
                setReminders((prev) =>
                  prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
                )
              }
              onDeleteReminder={(id) =>
                setReminders((prev) => prev.filter((r) => r.id !== id))
              }
              onClearCompleted={() =>
                setReminders((prev) => prev.filter((r) => !r.completed))
              }
              onAddToast={addToast}
              soundService={soundService}
              soundEnabled={soundEnabled}
              onTriggerAvatarAlert={(rem) => {
                desktopService.triggerOverlay(rem);
                setAvatarAlert({ ...rem, reminderId: rem.id || "test-rem" });
              }}
              isPiPSupported={desktopService.isPiPSupported()}
              isPiPActive={Boolean(pipWindow)}
              onTogglePiP={togglePiP}
            />
          </div>

          <div
            className={`tab-panel-wrapper ${activeTab === "settings" ? "active" : "inactive"}`}
            role="tabpanel"
            aria-hidden={activeTab !== "settings"}
          >
            <SettingsTab
              personaKey={personaKey}
              onSelectPersona={setPersonaKey}
              companionName={companionName}
              onChangeCompanionName={setCompanionName}
              geminiApiKey={geminiApiKey}
              onChangeGeminiApiKey={setGeminiApiKey}
              geminiModel={geminiModel}
              onChangeGeminiModel={setGeminiModel}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled((prev) => !prev)}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={() => setNotificationsEnabled((prev) => !prev)}
              accentColor={accentColor}
              onChangeAccentColor={setAccentColor}
              systemStats={systemStats}
              onRefreshStats={refreshStats}
              appInfo={appInfo}
              onAddToast={addToast}
            />
          </div>
        </div>

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />

        {/* Modal for creating a new companion reminder */}
        <ReminderModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={(newRem) => {
            setReminders((prev) => [newRem, ...prev]);
            addToast({
              type: "success",
              title: "Reminder Scheduled",
              message: `${newRem.title} (Every ${newRem.repeat})`
            });
          }}
        />

        {/* Interactive In-Window Companion Avatar Alert Fallback */}
        <AvatarAlert
          alert={avatarAlert}
          persona={currentPersona}
          onDismiss={() => setAvatarAlert(null)}
          onComplete={(reminderId) => {
            if (reminderId) {
              setReminders((prev) =>
                prev.map((r) => (r.id === reminderId ? { ...r, completed: true } : r))
              );
            }
            setAvatarAlert(null);
          }}
          onSnooze={(reminderId, minutes) => {
            if (reminderId) {
              setReminders((prev) =>
                prev.map((r) =>
                  r.id === reminderId
                    ? { ...r, dueAt: Date.now() + minutes * 60 * 1000, notified: false, completed: false }
                    : r
                )
              );
            }
            setAvatarAlert(null);
            addToast({
              type: "info",
              title: "Reminder Snoozed",
              message: `Snoozed for ${minutes} minutes`
            });
          }}
          soundEnabled={soundEnabled}
          avatarConfig={avatarConfig}
        />

        {/* Document Picture-in-Picture Floating Window Portal (Always on Top across all other tabs/windows) */}
        {pipWindow &&
          createPortal(
            <div className="pip-companion-root">
              <DesktopOverlayCompanion
                reminder={
                  avatarAlert || {
                    id: "pip-standby",
                    title: `${companionName} is Floating`,
                    category: "general",
                    description: "Watching over your tabs! Reminders will alert you right here."
                  }
                }
                characterConfig={avatarConfig}
                onFinish={() => {
                  if (avatarAlert) setAvatarAlert(null);
                }}
                onComplete={(reminderId) => {
                  if (reminderId) {
                    setReminders((prev) =>
                      prev.map((r) => (r.id === reminderId ? { ...r, completed: true } : r))
                    );
                  }
                  setAvatarAlert(null);
                }}
                onSnooze={(reminderId, minutes) => {
                  if (reminderId) {
                    setReminders((prev) =>
                      prev.map((r) =>
                        r.id === reminderId
                          ? { ...r, dueAt: Date.now() + minutes * 60 * 1000, notified: false, completed: false }
                          : r
                      )
                    );
                  }
                  setAvatarAlert(null);
                  addToast({
                    type: "info",
                    title: "Reminder Snoozed",
                    message: `Snoozed for ${minutes} minutes`
                  });
                }}
                soundEnabled={soundEnabled}
              />
            </div>,
            pipWindow.document.body
          )}
      </main>
    </div>
  );
}

// Top-level exported component protected by ErrorBoundary
export default function App() {
  if (isOverlayMode) {
    return (
      <ErrorBoundary>
        <OverlayApp />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
