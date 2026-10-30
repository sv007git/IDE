// Antigravity IDE - AI Agent Engine & Native Antigravity CLI Driver
const GEMINI_KEY_STORAGE = 'antigravity_gemini_api_key';
const GEMINI_MODEL_STORAGE = 'antigravity_gemini_model';

class AntigravityAgent {
  constructor() {
    this.apiKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
    this.model = localStorage.getItem(GEMINI_MODEL_STORAGE) || 'gemini-2.5-flash';
    this.history = [];
    this.isThinking = false;
    this.isNative = false;
    this.apiBase = '';
    this.hasAgy = false;
  }

  init(isNative = false, apiBase = '', hasAgy = false) {
    this.isNative = isNative;
    this.apiBase = apiBase;
    this.hasAgy = hasAgy;
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

    // If connected to native phone backend with official 'agy' installed:
    if (this.isNative && this.hasAgy) {
      try {
        await this.queryNativeAgy(userPrompt);
      } catch (err) {
        this.addMessage('assistant', `⚠️ **Antigravity CLI Error:** ${err.message}`);
      }
      this.isThinking = false;
      this.setAgentStatus('idle');
      return;
    }

    // Otherwise fallback to Gemini API or built-in assistant
    const activeFileName = window.fs?.activeFile || 'index.html';
    const activeFileContent = window.fs?.getFile(activeFileName) || '';
    const allFiles = Object.keys(window.fs?.files || {}).join(', ');

    if (this.apiKey) {
      try {
        await this.queryGeminiLive(userPrompt, activeFileName, activeFileContent, allFiles);
      } catch (err) {
        this.addMessage('assistant', `⚠️ **Gemini API Error:** ${err.message}`);
        this.queryOfflineAgent(userPrompt, activeFileName, activeFileContent);
      }
    } else {
      await new Promise(r => setTimeout(r, 400));
      this.queryOfflineAgent(userPrompt, activeFileName, activeFileContent);
    }

    this.isThinking = false;
    this.setAgentStatus('idle');
  }

  // Stream output directly from native Antigravity CLI ('agy') running on phone
  async queryNativeAgy(prompt) {
    const res = await fetch(`${this.apiBase}/api/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Agent execution failed' }));
      throw new Error(err.error || err.hint || `HTTP ${res.status}`);
    }

    const container = document.getElementById('agent-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'agent-msg assistant';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = '<span style="color: var(--accent-cyan);">⚡ Antigravity CLI executing on phone...</span><br><pre><code></code></pre>';
    msgDiv.appendChild(bubble);
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;

    const codeEl = bubble.querySelector('pre code');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      codeEl.textContent += text;
      container.scrollTop = container.scrollHeight;
    }

    // Refresh files if the agent modified any code in workspace
    if (window.fs && window.fs.refresh) {
      await window.fs.refresh();
      if (window.app) window.app.renderFileList();
      if (window.editorManager) window.editorManager.loadFile(window.fs.activeFile);
    }
  }

  async queryGeminiLive(prompt, activeFileName, activeFileContent, allFiles) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const systemPrompt = `You are Antigravity, an AI coding pair programmer.
Workspace files: [${allFiles}]. Active file: "${activeFileName}".
Code:
\`\`\`
${activeFileContent.slice(0, 4000)}
\`\`\``;

    const body = {
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nTask: ${prompt}` }] }]
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
    let reply = `### 🤖 Antigravity Assistant (Offline Mode)
Received: "${prompt}".

**Next Actions:**
- To run the **official Antigravity CLI (\`agy\`) natively on your phone's CPU & files**:
  1. Open Termux on your phone.
  2. Run: \`curl -fsSL https://raw.githubusercontent.com/sv007git/IDE/main/setup-android.sh | bash\`
  3. Open \`http://localhost:3000\` on your phone!`;

    this.addMessage('assistant', reply);
  }

  addMessage(role, text) {
    const container = document.getElementById('agent-messages');
    if (!container) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = `agent-msg ${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    if (typeof marked !== 'undefined') {
      bubble.innerHTML = marked.parse(text);
    } else {
      bubble.textContent = text;
    }

    // Add Apply to Editor buttons
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

      actionsDiv.appendChild(applyBtn);
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
      badge.innerHTML = '<span class="agent-pulse" style="background:#f59e0b"></span> Running...';
      badge.style.color = '#f59e0b';
    } else {
      const title = this.isNative ? 'Native Phone Engine' : 'Ready';
      badge.innerHTML = `<span class="agent-pulse"></span> ${title}`;
      badge.style.color = '#10b981';
    }
  }
}

window.agent = new AntigravityAgent();
