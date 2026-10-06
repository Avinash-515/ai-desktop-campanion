import React, { useState, useRef, useEffect } from "react";
import { IconSend, IconSparkles, IconCopy, IconCheck, IconTrash } from "./Icons";
import { desktopService } from "../services/desktopService";

export function ChatTab({
  messages,
  onSendMessage,
  isThinking,
  persona,
  onSelectTab,
  onClearChat,
  onAddToast,
  soundEnabled,
  systemStats
}) {
  const [inputVal, setInputVal] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputVal.trim() || isThinking) return;
    const text = inputVal.trim();
    setInputVal("");
    onSendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onAddToast({ type: "success", title: "Copied", message: "Message copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      // Clean markdown tags for cleaner speech
      const cleanText = text.replace(/[*#`_\[\]]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onAddToast({
        type: "warning",
        title: "Voice Input Unavailable",
        message: "Speech recognition is not supported in this runtime environment."
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputVal((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
        inputRef.current?.focus();
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleActionClick = async (action) => {
    if (action.type === "LAUNCH_APP") {
      const res = await desktopService.launchApp(action.target);
      onAddToast({
        type: res.success ? "success" : "error",
        title: action.label || "Application",
        message: res.message || (res.success ? "App launched" : "Launch failed")
      });
    } else if (action.type === "NAVIGATE_TAB") {
      onSelectTab(action.tab);
    } else if (action.type === "SHOW_STATS") {
      onSelectTab("settings");
    }
  };

  const suggestions = [
    { label: "💧 Remind Me to Drink Water", prompt: "Remind me to drink water in 20 minutes" },
    { label: "🚀 Open Visual Studio Code", prompt: "Open Visual Studio Code" },
    { label: "📊 Show System Information", prompt: "Show system information" },
    { label: "📁 Find My Project Files", prompt: "Find my project files" },
    { label: "📝 Summarize a Document", prompt: "Summarize a document" },
    { label: "⏰ Set 20-min Focus Reminder", prompt: "Remind me to take a break in 20 minutes" }
  ];

  return (
    <div className="chat-tab-container">
      <div className="chat-messages-area">
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <div className="companion-avatar-glow">
              <div className="avatar-orb">
                <span className="avatar-emoji">🤖</span>
              </div>
            </div>

            <h2 className="welcome-title">Hello! I'm {persona.name}.</h2>
            <p className="welcome-desc">
              Your AI desktop companion. I can execute commands, explore local files, launch applications, summarize documents, and keep your workflow on track.
            </p>

            <div className="suggestion-grid">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  className="suggestion-btn"
                  onClick={() => onSendMessage(s.prompt)}
                >
                  <span className="suggestion-text">{s.label}</span>
                  <span className="suggestion-arrow">→</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-row ${msg.sender === "user" ? "user-row" : "bot-row"}`}
              >
                <div className="message-avatar">
                  {msg.sender === "user" ? "👤" : "🤖"}
                </div>

                <div className="message-content-wrap">
                  <div className="message-header">
                    <span className="sender-name">
                      {msg.sender === "user" ? "You" : persona.name}
                    </span>
                    <span className="message-time">{msg.time}</span>
                  </div>

                  <div className="message-bubble">
                    <div
                      className="markdown-body"
                      dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(msg.text) }}
                    />

                    {msg.action && (
                      <div className="message-action-card">
                        <div className="action-card-info">
                          <span className="action-card-icon">⚡</span>
                          <span className="action-card-label">
                            {msg.action.type === "LAUNCH_APP" && `Action: Launch ${msg.action.label || msg.action.target}`}
                            {msg.action.type === "NAVIGATE_TAB" && `Action: Open ${msg.action.tab} tab`}
                            {msg.action.type === "SHOW_STATS" && `Action: View Full Diagnostics`}
                            {msg.action.type === "CREATE_REMINDER" && `Action: Scheduled Reminder`}
                          </span>
                        </div>
                        <button
                          className="action-card-btn"
                          onClick={() => handleActionClick(msg.action)}
                        >
                          Execute
                        </button>
                      </div>
                    )}
                  </div>

                  {msg.sender === "bot" && (
                    <div className="message-actions-bar">
                      <button
                        className="micro-btn"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? <IconCheck size={13} /> : <IconCopy size={13} />}
                        <span>{copiedId === msg.id ? "Copied" : "Copy"}</span>
                      </button>

                      <button
                        className="micro-btn"
                        onClick={() => handleSpeak(msg.text)}
                        title="Read Aloud"
                      >
                        <span>🔊 Speak</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="message-row bot-row thinking-row">
                <div className="message-avatar">🤖</div>
                <div className="message-content-wrap">
                  <div className="message-bubble thinking-bubble">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="thinking-text">{persona.name} is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="chat-bottom-bar">
        {messages.length > 0 && (
          <div className="chat-toolbar">
            <span className="toolbar-info">
              {messages.length} messages in conversation
            </span>
            <button className="clear-btn" onClick={onClearChat} title="Clear conversation">
              <IconTrash size={13} />
              <span>Clear Chat</span>
            </button>
          </div>
        )}

        <form className="chat-input-form" onSubmit={handleSubmit}>
          <button
            type="button"
            className={`voice-btn ${isListening ? "listening" : ""}`}
            onClick={handleVoiceInput}
            title={isListening ? "Listening... Click to stop" : "Voice Input (Speech-to-text)"}
          >
            🎙️
          </button>

          <input
            ref={inputRef}
            type="text"
            className="chat-input-field"
            placeholder={`Ask ${persona.name} anything, or type "open vscode", "system info", "remind me..."`}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isThinking}
          />

          <button
            type="submit"
            className={`send-button ${inputVal.trim() ? "ready" : ""}`}
            disabled={!inputVal.trim() || isThinking}
            title="Send Message"
          >
            <IconSend size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

// Lightweight, safe HTML markdown formatter for code blocks, bold, headers, and lists
function renderSimpleMarkdown(text) {
  if (!text) return "";

  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks: ```lang\ncode\n```
  escaped = escaped.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/gi, (_, lang, code) => {
    return `<div class="code-block"><div class="code-header">${lang || "code"}</div><pre><code>${code.trim()}</code></pre></div>`;
  });

  // Inline code: `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Headers: ### Header
  escaped = escaped.replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>');
  escaped = escaped.replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>');
  escaped = escaped.replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

  // Bold: **text**
  escaped = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic: *text*
  escaped = escaped.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Bullet points: - item
  escaped = escaped.replace(/^\s*-\s+(.*$)/gim, '<li class="md-li">$1</li>');

  // Convert line breaks to <br /> (except around block elements)
  escaped = escaped.replace(/\n/g, "<br />");
  escaped = escaped.replace(/<\/div><br \/>/g, "</div>");
  escaped = escaped.replace(/<\/pre><br \/>/g, "</pre>");
  escaped = escaped.replace(/<\/li><br \/>/g, "</li>");

  return escaped;
}
