# 🤖 AI Desktop Companion

A modern, offline-first AI Desktop Companion built with **Electron 44**, **React 19**, and **Vite**.

Designed as a personal desktop command center, the companion connects directly with your local operating system to launch applications, explore project files, analyze & summarize documents, schedule desktop timers, and provide generative AI intelligence.

---

## ✨ Features & Capabilities

### 1. 💬 Interactive AI Assistant (Chat)
- **Natural Language Desktop Execution**:
  - *"Open VS Code"*, *"Launch Terminal"*, *"Open Calculator"*, *"Open Browser"*, *"Show Task Manager"*
  - *"Show system information"* (generates real hardware diagnostics)
  - *"Remind me to take a break in 20 minutes"* (schedules background desktop timer)
  - *"Find project files"* or *"Summarize document"*
- **Dual-Engine Intelligence**:
  - **Built-in Local Intelligence**: Works instantly offline with zero configuration and zero API keys.
  - **Google Gemini API Integration**: Add your Gemini API key in Settings to unlock deep conversational knowledge and reasoning with models like `gemini-2.5-flash`, `gemini-1.5-flash`, and `gemini-1.5-pro`.
- **Personality Modes**: Choose between *Nova* (Productive & Efficient), *Jarvis* (System Commander), *Luna* (Warm & Creative), or *Cypher* (Technical Code Specialist).
- **Text-to-Speech (TTS)**: Reads companion responses aloud using speech synthesis.
- **Voice Input**: Integrated speech-to-text recognition.
- **Action Cards**: One-click execution cards attached to responses.

### 2. ▦ Applications Launcher
- Instant launchers for developer tools, utilities, and productivity apps:
  - Visual Studio Code, Windows Terminal / PowerShell, File Explorer, Web Browser, Calculator, Notepad, Task Manager, Windows Settings, Google Chrome.
- **Custom Command Runner**: Launch any executable path, URL (`https://...`), or CLI command (`code .`, `mspaint`, `cmd`).
- **Recent Launches**: One-click relaunch history with timestamps.

### 3. ⌕ Desktop Files Explorer
- Quick-jump directories: **Project Root**, **Documents**, **Desktop**, **Downloads**, **Home**.
- Folder navigation with Up / Refresh controls and breadcrumbs.
- Real-time search filter for file names and extensions.
- List view and Grid view modes.
- Actions:
  - Open file with default OS application.
  - Reveal file in File Explorer / Finder.
  - Load into **Document Summarizer** with one click.
  - Ask companion about the file in Chat.

### 4. ▤ Document Intelligence & Summarizer
- Open local `.md`, `.txt`, `.json`, `.csv`, code, or log files via native OS file dialog or paste text.
- Live document metrics: Word count, character count, lines, estimated reading time.
- 4 AI Summarization modes:
  - **Executive TL;DR**: Concise high-level summary.
  - **Key Takeaways**: Core bullet points.
  - **Action Items**: Extracted actionable to-dos and next steps.
  - **Technical Breakdown**: Code and structural analysis.
- Copy summary or send directly to Chat for interactive discussion.

### 5. ◷ Animated Avatar Reminders & Focus Timers
- **Interactive Companion Avatar Popups**: Instead of quiet toasts, when a reminder triggers (e.g. *Drink Water* 💧, *Take a Break* 🧘), your animated companion character pops up on screen with glowing aura, blinking eyes, waving gestures, and an interactive speech bubble dialog!
- **Voice Synthesis & Audio**: Automatically reads reminder messages aloud using Text-to-Speech (TTS).
- **Interactive Actions**:
  - *"I Drank Water! 💧"* $\rightarrow$ Companion celebrates with confetti particles and smiles!
  - *"⏰ Snooze 5m"* $\rightarrow$ Reschedules reminder for +5 minutes.
  - One-click **"🤖 Preview Avatar Alert Now"** button to test the avatar anytime.
- Quick timer presets: `💧 +20m Drink Water`, `☕ +10m Break`, `🍅 +25m Pomodoro Focus`, `💻 +45m Code Review`.
- Brings the desktop window into focus if minimized and plays synthesized reminder chime.

### 6. ⚙ Settings & Hardware Telemetry
- Real-time CPU model, core count, RAM usage gauge, OS platform, and uptime.
- Companion identity customizer.
- Google Gemini API key configuration with connection test tool.
- Accent theme customization: **Electric Blue**, **Cyber Teal**, **Neon Violet**, **Sunset Amber**.
- Web Audio sound effects and desktop notifications toggles.

---

## 🛠️ Technology Architecture

- **Desktop Framework**: [Electron 44](https://www.electronjs.org/) with secure context isolation, sandboxing, and strongly typed IPC preload bridge (`electron/preload.cjs`).
- **Frontend**: [React 19](https://react.dev/) + [Vite 8](https://vite.dev/).
- **Styling**: Pure CSS Design System with dark space aesthetics, glassmorphism, glowing accents, and micro-animations.
- **Audio Engine**: Synthesizer using Web Audio API (zero external audio asset dependencies).
- **Storage**: Safe `localStorage` syncing for chat history, preferences, and reminders.

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v18+ recommended)
- npm

### 1. Development Mode (Vite + Electron)
```bash
npm run dev
```
This runs the Vite development server and launches Electron concurrently.

### 2. Browser Preview Mode (Standalone Web)
```bash
npm run preview
```
Or run `npx vite` directly in any web browser. The app includes graceful simulated fallbacks when running outside Electron.

### 3. Production Build
```bash
npm run build
```
Generates production-optimized assets in `dist/`.

---

## 🔒 Security
- `contextIsolation: true`
- `nodeIntegration: false`
- Safe IPC bridge avoiding exposure of raw Node.js primitives to the renderer.
