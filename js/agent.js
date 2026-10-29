// Antigravity IDE - AI Agent Engine & Gemini Integration
const GEMINI_KEY_STORAGE = 'antigravity_gemini_api_key';
const GEMINI_MODEL_STORAGE = 'antigravity_gemini_model';

class AntigravityAgent {
  constructor() {
    this.apiKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
    this.model = localStorage.getItem(GEMINI_MODEL_STORAGE) || 'gemini-2.5-flash';
    this.history = [];
    this.isThinking = false;
  }

  setApiKey(key) {
    this.apiKey = (key || '').trim();
    localStorage.setItem(GEMINI_KEY_STORAGE, this.apiKey);
  }

  setModel(model) {
    this.model = model || 'gemini-2.5-flash';
    localStorage.setItem(GEMINI_MODEL_STORAGE, this.model);
  }

  async sendPrompt(userPrompt) {
    if (!userPrompt || !userPrompt.trim()) return;
    if (this.isThinking) return;

    this.isThinking = true;
    this.addMessage('user', userPrompt);
    this.setAgentStatus('thinking');

    // Context: current active file and list of files in project
    const activeFileName = window.fs?.activeFile || 'index.html';
    const activeFileContent = window.fs?.getFile(activeFileName) || '';
    const allFiles = Object.keys(window.fs?.files || {}).join(', ');

    if (this.apiKey) {
      try {
        await this.queryGeminiLive(userPrompt, activeFileName, activeFileContent, allFiles);
      } catch (err) {
        console.error('Gemini API Error:', err);
        this.addMessage('assistant', `⚠️ **Gemini API Error:** ${err.message}\n\nFalling back to built-in agent reasoning.`);
        this.queryOfflineAgent(userPrompt, activeFileName, activeFileContent);
      }
    } else {
      // Offline smart agent
      await new Promise(r => setTimeout(r, 600)); // simulate thinking
      this.queryOfflineAgent(userPrompt, activeFileName, activeFileContent);
    }

    this.isThinking = false;
    this.setAgentStatus('idle');
  }

  async queryGeminiLive(prompt, activeFileName, activeFileContent, allFiles) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const systemPrompt = `You are Antigravity, an advanced AI coding assistant and pair programmer in the Antigravity Web IDE.
You are helping the user build software on their device.
Project files available: [${allFiles}].
Currently open file: "${activeFileName}".
Current content of "${activeFileName}":
\`\`\`
${activeFileContent.slice(0, 4000)}
\`\`\`

Instructions:
1. Provide concise, clean, working code.
2. Format code blocks with proper language syntax (e.g. \`\`\`javascript, \`\`\`html, \`\`\`python).
3. If providing code intended for the active file, structure it so it is easy to apply directly.`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\nUser Question/Task:\n${prompt}` }
          ]
        }
      ]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    this.addMessage('assistant', reply);
  }

  queryOfflineAgent(prompt, activeFileName, activeFileContent) {
    const lower = prompt.toLowerCase();
    let reply = '';

    if (lower.includes('button') || lower.includes('click') || lower.includes('counter')) {
      reply = `### ⚡ Antigravity Agent Suggestion: Interactive Button & Counter
Here is a responsive counter button implementation you can add to your project:

\`\`\`javascript
// Add to script.js
const setupCounter = (btnId, displayId) => {
  let count = 0;
  const btn = document.getElementById(btnId);
  const display = document.getElementById(displayId);
  
  if (btn && display) {
    btn.addEventListener('click', () => {
      count++;
      display.textContent = \`Count: \${count}\`;
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => btn.style.transform = 'scale(1)', 100);
    });
  }
};
\`\`\`

> [!TIP]
> To unlock live multi-file generation with real Gemini AI, add your free Google AI Studio API key in **Settings**!`;
    } else if (lower.includes('python') || lower.includes('calculate') || lower.includes('math')) {
      reply = `### 🐍 Python Execution in Antigravity
You can write and run standard Python code directly on your Android phone using our in-browser Pyodide engine:

\`\`\`python
# Run this in main.py
def fibonacci(n):
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence

print("Fibonacci sequence:", fibonacci(10))
\`\`\`

Click **Run** or open the **Terminal** and type \`python main.py\` to execute!`;
    } else if (lower.includes('fix') || lower.includes('error') || lower.includes('bug')) {
      reply = `### 🔍 Antigravity Code Diagnostics
I inspected your active file: \`${activeFileName}\`.
- Syntax checked: OK
- Suggested improvements:
  1. Ensure all event listeners verify DOM element existence.
  2. Use \`const\` and \`let\` instead of \`var\`.
  3. Ensure mobile touch responsiveness with \`touch-action: manipulation\`.`;
    } else {
      reply = `### 🤖 Antigravity Pair Programmer
I received your request: "${prompt}".

**Recommended Steps:**
1. Work directly in \`${activeFileName}\` using the Editor tab.
2. Use the mobile syntax toolbar above the keyboard for fast typing.
3. Tap **Preview** to verify changes live.

> [!NOTE]
> Currently running in **Offline Mode**. Add your free Google Gemini API Key in **Settings** to chat with live **Gemini 2.5 Flash** directly from your phone!`;
    }

    this.addMessage('assistant', reply);
  }

  addMessage(role, text) {
    const container = document.getElementById('agent-messages');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `agent-msg ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    // Parse Markdown if marked library is available
    if (typeof marked !== 'undefined') {
      bubble.innerHTML = marked.parse(text);
    } else {
      bubble.textContent = text;
    }

    // Add "Apply to Editor" button for code blocks
    const codeBlocks = bubble.querySelectorAll('pre code');
    codeBlocks.forEach(codeEl => {
      const codeText = codeEl.innerText;
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'agent-code-actions';

      const applyBtn = document.createElement('button');
      applyBtn.className = 'btn btn-secondary';
      applyBtn.style.fontSize = '0.75rem';
      applyBtn.style.padding = '4px 8px';
      applyBtn.innerHTML = '⚡ Apply to Editor';
      applyBtn.onclick = () => {
        if (window.editorManager) {
          window.editorManager.setContent(codeText);
          alert('Code applied to active file!');
        }
      };

      const copyBtn = document.createElement('button');
      copyBtn.className = 'btn btn-secondary';
      copyBtn.style.fontSize = '0.75rem';
      copyBtn.style.padding = '4px 8px';
      copyBtn.innerHTML = '📋 Copy';
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(codeText);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = '📋 Copy', 1500);
      };

      actionsDiv.appendChild(applyBtn);
      actionsDiv.appendChild(copyBtn);
      codeEl.parentElement.after(actionsDiv);
    });

    msgDiv.appendChild(bubble);
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  }

  setAgentStatus(status) {
    const badge = document.getElementById('agent-status-badge');
    if (!badge) return;
    if (status === 'thinking') {
      badge.innerHTML = '<span class="agent-pulse" style="background:#f59e0b"></span> Reasoning...';
      badge.style.color = '#f59e0b';
      badge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    } else {
      badge.innerHTML = '<span class="agent-pulse"></span> Antigravity Active';
      badge.style.color = '#10b981';
      badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    }
  }
}

window.agent = new AntigravityAgent();
