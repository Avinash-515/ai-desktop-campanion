// AI Engine supporting both Built-in Intelligence and Google Gemini API

export const PERSONALITIES = {
  nova: {
    name: "Nova",
    tagline: "Efficient & Intelligent Desktop Assistant",
    promptPrefix: "You are Nova, a helpful, ultra-efficient, and polished AI desktop companion.",
    greeting: "Hello! I'm Nova, your AI desktop companion. How can I assist your workflow today?"
  },
  jarvis: {
    name: "Jarvis",
    tagline: "Executive System Commander",
    promptPrefix: "You are Jarvis, an executive-level, sophisticated system commander with impeccable precision.",
    greeting: "Jarvis online. Systems standing by. What directive shall we execute, boss?"
  },
  luna: {
    name: "Luna",
    tagline: "Friendly & Creative Workflow Partner",
    promptPrefix: "You are Luna, a warm, encouraging, and creative desktop companion.",
    greeting: "Hey there! I'm Luna. Ready to tackle projects, brainstorm ideas, or organize your day!"
  },
  cypher: {
    name: "Cypher",
    tagline: "Technical Code & Systems Specialist",
    promptPrefix: "You are Cypher, an expert software engineer and systems analyst.",
    greeting: "Cypher initialized. Terminals, scripts, and runtime telemetry ready for inspection."
  }
};

export const aiEngine = {
  async processQuery({
    prompt,
    history = [],
    personaKey = "nova",
    geminiApiKey = "",
    geminiModel = "gemini-2.5-flash",
    systemStats = null
  }) {
    const persona = PERSONALITIES[personaKey] || PERSONALITIES.nova;
    const cleanPrompt = prompt.trim().toLowerCase();

    // 1. Direct Intent Detection for Desktop Actions
    const actionMatch = detectDesktopIntent(cleanPrompt, systemStats);
    if (actionMatch && !geminiApiKey) {
      return actionMatch;
    }

    // 2. If Gemini API key is provided, use Google Gemini REST API
    if (geminiApiKey && geminiApiKey.trim().length > 10) {
      try {
        const geminiResult = await callGeminiApi({
          prompt,
          history,
          apiKey: geminiApiKey.trim(),
          model: geminiModel,
          persona,
          systemStats
        });
        if (geminiResult) {
          // Check if Gemini suggested an action or if we should attach local action
          if (actionMatch) {
            return {
              text: geminiResult,
              action: actionMatch.action
            };
          }
          return { text: geminiResult };
        }
      } catch (err) {
        console.warn("Gemini API call failed, falling back to local engine:", err);
        // Fall back to local engine with note
        const local = generateLocalResponse(cleanPrompt, persona, systemStats);
        return {
          text: `*[Using Local Engine: Gemini API request encountered an issue (${err.message})]*\n\n${local.text}`,
          action: local.action || actionMatch?.action
        };
      }
    }

    // 3. Built-in Intelligence Engine
    if (actionMatch) {
      return actionMatch;
    }

    return generateLocalResponse(cleanPrompt, persona, systemStats);
  }
};

function detectDesktopIntent(prompt, stats) {
  // App Launching
  if (prompt.includes("open vscode") || prompt.includes("open code") || prompt.includes("launch vs code") || prompt.includes("visual studio code")) {
    return {
      text: "Launching **Visual Studio Code** for you now. Happy coding!",
      action: { type: "LAUNCH_APP", target: "code", label: "Visual Studio Code" }
    };
  }
  if (prompt.includes("open terminal") || prompt.includes("open powershell") || prompt.includes("launch terminal") || prompt.includes("open cmd")) {
    return {
      text: "Opening **PowerShell / Terminal** window right away.",
      action: { type: "LAUNCH_APP", target: "terminal", label: "Terminal / PowerShell" }
    };
  }
  if (prompt.includes("open calculator") || prompt.includes("calc") || prompt.includes("launch calculator")) {
    return {
      text: "Opening **Calculator** for quick calculations.",
      action: { type: "LAUNCH_APP", target: "calculator", label: "Calculator" }
    };
  }
  if (prompt.includes("open notepad") || prompt.includes("open notes") || prompt.includes("text editor")) {
    return {
      text: "Starting **Notepad** for your quick notes.",
      action: { type: "LAUNCH_APP", target: "notepad", label: "Notepad" }
    };
  }
  if (prompt.includes("open explorer") || prompt.includes("file explorer") || prompt.includes("open files")) {
    return {
      text: "Opening **File Explorer** at your default directory.",
      action: { type: "LAUNCH_APP", target: "explorer", label: "File Explorer" }
    };
  }
  if (prompt.includes("open browser") || prompt.includes("open chrome") || prompt.includes("open edge")) {
    const target = prompt.includes("chrome") ? "chrome" : prompt.includes("edge") ? "edge" : "browser";
    return {
      text: `Opening your **Web Browser**.`,
      action: { type: "LAUNCH_APP", target, label: "Web Browser" }
    };
  }
  if (prompt.includes("task manager") || prompt.includes("taskmgr") || prompt.includes("system monitor")) {
    return {
      text: "Launching **Task Manager** to inspect running processes.",
      action: { type: "LAUNCH_APP", target: "taskmgr", label: "Task Manager" }
    };
  }

  // System Stats Check
  if (prompt.includes("system info") || prompt.includes("system information") || prompt.includes("cpu") || prompt.includes("ram") || prompt.includes("specs") || prompt.includes("hardware") || prompt.includes("telemetry")) {
    const cpu = stats?.cpuModel || "Multi-core CPU";
    const cores = stats?.cpuCount || "N/A";
    const ram = stats ? `${stats.usedMemGB} GB / ${stats.totalMemGB} GB (${stats.memPercent}%)` : "Telemetry loaded";
    const host = stats?.hostname || "Local Machine";
    const osPlatform = stats?.platform || "Windows";

    return {
      text: `### 📊 Live System Diagnostic\n- **Host**: \`${host}\` (${osPlatform})\n- **CPU**: ${cpu} (${cores} Cores)\n- **Memory**: ${ram}\n- **Companion Status**: Active & Responsive\n\nYou can also visit the **Settings** or **Header pill** for continuous real-time monitoring.`,
      action: { type: "SHOW_STATS", stats }
    };
  }

  // File Search / Browse
  if (prompt.includes("find my project files") || prompt.includes("find files") || prompt.includes("browse files") || prompt.includes("explore documents")) {
    return {
      text: "Switching to the **Files Explorer** tab so you can inspect and open local directory contents directly.",
      action: { type: "NAVIGATE_TAB", tab: "files" }
    };
  }

  // Document Summarize
  if (prompt.includes("summarize a document") || prompt.includes("summarize file") || prompt.includes("read notes") || prompt.includes("analyze document")) {
    return {
      text: "Opening the **Documents Studio** tab. You can load any Markdown, code, or text file to generate instant executive summaries and action items.",
      action: { type: "NAVIGATE_TAB", tab: "documents" }
    };
  }

  // Reminders
  const reminderRegex = /(?:remind me to|set a reminder to|reminder:?)\s*(.+?)(?:\s+in\s+(\d+)\s*(?:min|minute|minutes|m|hour|hours|h))?$/i;
  const remMatch = prompt.match(reminderRegex);
  if (remMatch) {
    const title = remMatch[1].trim();
    const minutes = remMatch[2] ? parseInt(remMatch[2], 10) : 15;
    const isWater = title.toLowerCase().includes("water") || title.toLowerCase().includes("drink");
    return {
      text: isWater
        ? `Got it! I scheduled a **Water Hydration Reminder** for you in **${minutes} minutes**. When the time arrives, I will pop up directly on your screen as your animated companion avatar with speech audio to remind you to drink water! 💧`
        : `Got it! I scheduled a reminder for you: **"${title}"** in **${minutes} minutes**. I'll pop up directly on your screen with an interactive avatar message when it's time!`,
      action: { type: "CREATE_REMINDER", title, minutes, category: isWater ? "health" : "work" }
    };
  }

  return null;
}

function generateLocalResponse(cleanPrompt, persona, stats) {
  if (cleanPrompt.includes("hello") || cleanPrompt.includes("hi") || cleanPrompt.includes("hey") || cleanPrompt.includes("who are you")) {
    return {
      text: `Hello! I'm **${persona.name}**, your desktop companion.\n\nI can directly interact with your computer:\n- 🚀 **Launch apps** (VS Code, Terminal, Browser, Calculator, Notepad)\n- 📁 **Explore files & projects**\n- 📝 **Summarize documents and text**\n- ⏰ **Set native desktop reminders**\n- 📊 **Monitor hardware metrics** (CPU, RAM, uptime)\n\nWhat would you like to do?`
    };
  }

  if (cleanPrompt.includes("help") || cleanPrompt.includes("what can you do") || cleanPrompt.includes("capabilities")) {
    return {
      text: `Here are my primary commands and capabilities:\n\n1. **App Control**: Type *"open vscode"*, *"open terminal"*, *"open calculator"*, or *"open browser"*.\n2. **File Explorer**: Type *"find project files"* or visit the **Files** tab.\n3. **Document Insights**: Type *"summarize a document"* or load notes in the **Documents** tab.\n4. **Reminders**: Type *"remind me to take a break in 20 minutes"*.\n5. **Hardware**: Type *"show system info"* to see live CPU and RAM stats.\n6. **General Intelligence**: Ask me programming questions, writing prompts, or math problems!`
    };
  }

  if (cleanPrompt.includes("react") || cleanPrompt.includes("javascript") || cleanPrompt.includes("code") || cleanPrompt.includes("electron")) {
    return {
      text: `Here is a quick overview regarding your desktop companion tech stack:\n\n- **Frontend**: React 19 + Vite (High-speed HMR, functional components)\n- **Desktop Runtime**: Electron 44 with secure context isolation\n- **IPC Architecture**: Preload bridge securely routing OS commands without exposing raw Node to the renderer\n\nNeed help writing a component, adding an IPC handler, or debugging an issue? Just ask!`
    };
  }

  if (cleanPrompt.includes("joke") || cleanPrompt.includes("funny")) {
    return {
      text: `Why do programmers prefer dark mode?\n\n*Because light attracts bugs!* 🐛💡`
    };
  }

  // Default contextual assistant response
  return {
    text: `I've noted that! As your **${persona.name}** companion, I can help you with this right from your desktop.\n\nTry asking me to:\n- Launch an app: *"Open VS Code"* or *"Open Terminal"*\n- Inspect hardware: *"Show system information"*\n- Set an alert: *"Remind me to check deployment in 10 minutes"*\n\n*(Tip: Add your Gemini API Key in Settings for unlimited conversational intelligence!)*`
  };
}

async function callGeminiApi({ prompt, history, apiKey, model, persona, systemStats }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const systemInstruction = `${persona.promptPrefix}
You are integrated directly into the user's desktop application.
System Environment:
- Platform: ${systemStats?.platform || "Windows"}
- Host: ${systemStats?.hostname || "Localhost"}
- CPU: ${systemStats?.cpuModel || "Modern CPU"}
- Total RAM: ${systemStats?.totalMemGB || "16"} GB

Be concise, articulate, and highly helpful. Format responses using clean GitHub Markdown.`;

  const contents = [];

  // Add past conversation turns
  if (Array.isArray(history) && history.length > 0) {
    history.slice(-6).forEach((msg) => {
      contents.push({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      });
    });
  }

  // Add current turn
  contents.push({
    role: "user",
    parts: [{ text: prompt }]
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) {
    throw new Error("No response generated from Gemini API");
  }
  return candidate;
}
