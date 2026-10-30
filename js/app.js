// Antigravity IDE - Master Application Controller
class AntigravityApp {
  constructor() {
    this.currentPanel = 'editor';
    this.backendActive = false;
    this.apiBase = '';
    this.systemInfo = null;
  }

  async init() {
    // 1. Detect if local Android phone backend is accessible
    await this.detectBackend();

    // 2. Initialize file system (native or virtual)
    if (window.fs) await window.fs.init(this.backendActive ? this.apiBase : null);

    // 3. Initialize components
    if (window.editorManager) window.editorManager.init();
    if (window.terminal) window.terminal.init(this.backendActive, this.apiBase);
    if (window.agent) window.agent.init(this.backendActive, this.apiBase, this.systemInfo?.agyInstalled);
    if (window.auth) window.auth.updateUI();

    this.initNavigation();
    this.initHeaderActions();
    this.initFileExplorer();
    this.initAgentChat();
    this.initSettingsModal();
    this.initPWA();

    this.switchPanel('editor');
  }

  async detectBackend() {
    // Try current origin first (if served from node server.js on localhost:3000)
    const originsToTry = ['', 'http://localhost:3000'];
    
    for (const base of originsToTry) {
      try {
        const res = await fetch(`${base}/api/status`, { cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            this.backendActive = true;
            this.apiBase = base;
            this.systemInfo = data;
            this.updateSystemBadge(true, data);
            return;
          }
        }
      } catch (e) {}
    }

    this.backendActive = false;
    this.updateSystemBadge(false);
  }

  updateSystemBadge(isNative, data = null) {
    const badge = document.getElementById('system-mode-badge');
    if (!badge) return;

    if (isNative && data) {
      badge.textContent = `🟢 Phone (${data.arch})`;
      badge.className = 'brand-badge mode-native';
      badge.title = `Hardware: ${data.cpuCount} Cores | ${data.freeMemMB}MB RAM | Antigravity: ${data.agyVersion}`;
      badge.onclick = () => this.showSystemModal(data);
    } else {
      badge.textContent = `🟡 Web Sandbox`;
      badge.className = 'brand-badge mode-sandbox';
      badge.title = 'Click to see how to connect your phone\'s native CPU & Antigravity CLI';
      badge.onclick = () => this.showSetupModal();
    }
  }

  showSystemModal(data) {
    alert(`📱 Phone Hardware & Antigravity Status:\n\n` +
          `• Architecture: ${data.arch} (${data.platform})\n` +
          `• CPU Cores: ${data.cpuCount} (${data.cpuModel})\n` +
          `• Memory: ${data.freeMemMB} MB free / ${data.totalMemMB} MB total\n` +
          `• Antigravity CLI: ${data.agyVersion}\n` +
          `• Workspace: ${data.workspaceDir}\n\n` +
          `Commands in Terminal execute natively on your phone!`);
  }

  showSetupModal() {
    alert(`⚡ To use your Phone's Native CPU, Linux Shell & Antigravity CLI:\n\n` +
          `1. Open Termux on your phone.\n` +
          `2. Paste & Run this command:\n` +
          `   curl -fsSL https://raw.githubusercontent.com/sv007git/IDE/main/setup-android.sh | bash\n\n` +
          `3. Open http://localhost:3000 in Chrome.\n\n` +
          `This unlocks native bash commands, local files, and Google Antigravity ('agy') on your phone!`);
  }

  initNavigation() {
    const navItems = document.querySelectorAll('.mobile-bottom-nav .nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const panel = item.getAttribute('data-panel');
        if (panel) this.switchPanel(panel);
      });
    });
  }

  switchPanel(panelId) {
    this.currentPanel = panelId;

    document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(item => {
      if (item.getAttribute('data-panel') === panelId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    document.querySelectorAll('.panel').forEach(panel => {
      if (panel.id === `panel-${panelId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    if (panelId === 'editor') {
      setTimeout(() => {
        if (window.editorManager && window.editorManager.editor) {
          window.editorManager.editor.refresh();
        }
      }, 50);
    } else if (panelId === 'preview') {
      if (window.runner) window.runner.runActive();
    } else if (panelId === 'files') {
      this.renderFileList();
    }
  }

  initHeaderActions() {
    const runBtn = document.getElementById('btn-run-header');
    if (runBtn) {
      runBtn.addEventListener('click', () => {
        const isPython = window.fs?.activeFile.endsWith('.py');
        if (isPython) {
          this.switchPanel('terminal');
        } else {
          this.switchPanel('preview');
        }
        if (window.runner) window.runner.runActive();
      });
    }

    const agentBtn = document.getElementById('btn-agent-header');
    if (agentBtn) {
      agentBtn.addEventListener('click', () => {
        this.switchPanel('agent');
      });
    }

    const avatarBtn = document.getElementById('user-avatar-btn');
    if (avatarBtn) {
      avatarBtn.addEventListener('click', () => {
        this.openSettingsModal();
      });
    }

    const fsBtn = document.getElementById('btn-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  initFileExplorer() {
    this.renderFileList();

    const newFileBtn = document.getElementById('btn-new-file');
    if (newFileBtn) {
      newFileBtn.addEventListener('click', async () => {
        const filename = prompt('Enter new filename (e.g. app.py, index.html, main.js):');
        if (filename && window.fs) {
          const ok = await window.fs.createFile(filename, '');
          if (ok) {
            this.renderFileList();
            if (window.editorManager) window.editorManager.loadFile(filename);
            this.switchPanel('editor');
          }
        }
      });
    }

    const exportBtn = document.getElementById('btn-export-zip');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (window.fs && window.fs.exportZip) window.fs.exportZip();
      });
    }
  }

  renderFileList() {
    const list = document.getElementById('file-list');
    if (!list || !window.fs) return;

    list.innerHTML = '';
    const files = Object.keys(window.fs.files);

    files.forEach(filename => {
      const item = document.createElement('div');
      item.className = `file-item ${filename === window.fs.activeFile ? 'active' : ''}`;

      const left = document.createElement('div');
      left.className = 'file-item-left';

      const icon = document.createElement('span');
      icon.textContent = filename.endsWith('.py') ? '🐍' :
                         filename.endsWith('.html') ? '🌐' :
                         filename.endsWith('.css') ? '🎨' :
                         filename.endsWith('.js') ? '⚡' :
                         filename.endsWith('.json') ? '📋' :
                         filename.endsWith('.md') ? '📝' : '📄';

      const name = document.createElement('span');
      name.textContent = filename;

      left.appendChild(icon);
      left.appendChild(name);

      left.onclick = async () => {
        window.fs.activeFile = filename;
        if (window.fs.isNative) {
          await window.fs.loadNativeFileContent(filename);
        }
        if (window.editorManager) window.editorManager.loadFile(filename);
        this.renderFileList();
        this.switchPanel('editor');
      };

      const actions = document.createElement('div');
      actions.className = 'file-actions';

      // Rename
      const renameBtn = document.createElement('button');
      renameBtn.className = 'btn-icon';
      renameBtn.style.width = '24px';
      renameBtn.style.height = '24px';
      renameBtn.innerHTML = '✏️';
      renameBtn.onclick = async (e) => {
        e.stopPropagation();
        const newName = prompt(`Rename ${filename} to:`, filename);
        if (newName && newName !== filename) {
          await window.fs.renameFile(filename, newName);
          this.renderFileList();
          if (window.editorManager) window.editorManager.loadFile(window.fs.activeFile);
        }
      };

      // Delete
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-icon';
      deleteBtn.style.width = '24px';
      deleteBtn.style.height = '24px';
      deleteBtn.innerHTML = '🗑️';
      deleteBtn.onclick = async (e) => {
        e.stopPropagation();
        if (confirm(`Delete ${filename}?`)) {
          await window.fs.deleteFile(filename);
          this.renderFileList();
          if (window.editorManager) window.editorManager.loadFile(window.fs.activeFile);
        }
      };

      actions.appendChild(renameBtn);
      actions.appendChild(deleteBtn);

      item.appendChild(left);
      item.appendChild(actions);
      list.appendChild(item);
    });
  }

  initAgentChat() {
    const input = document.getElementById('agent-input');
    const sendBtn = document.getElementById('btn-agent-send');

    const handleSend = () => {
      const text = input.value.trim();
      if (text && window.agent) {
        input.value = '';
        window.agent.sendPrompt(text);
      }
    };

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSend();
      });
    }

    // Initial greeting
    if (window.agent) {
      if (this.backendActive && this.systemInfo?.agyInstalled) {
        window.agent.addMessage('assistant', `⚡ **Antigravity CLI Connected!**\nRunning on your phone's native **${this.systemInfo.arch}** processor.\n\nAll tasks you send here will execute through Google Antigravity's official \`agy\` CLI engine with access to your real phone files and shell.`);
      } else {
        window.agent.addMessage('assistant', `👋 **Antigravity IDE Ready.**\n\n- **Phone Native Mode**: Run \`bash setup-android.sh\` in Termux to connect your phone's native ARM64 CPU, local Linux shell, and Antigravity CLI (\`agy\`).\n- **Cloud / Standalone**: Add your Gemini API key in Settings to use Gemini directly.`);
      }
    }
  }

  initSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('btn-close-settings');
    const saveSettingsBtn = document.getElementById('btn-save-settings');
    const demoLoginBtn = document.getElementById('btn-demo-login');
    const signOutBtn = document.getElementById('btn-sign-out');

    if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('active');
      };
    }

    const apiKeyInput = document.getElementById('setting-gemini-key');
    const modelSelect = document.getElementById('setting-gemini-model');
    const clientIdInput = document.getElementById('setting-google-client-id');

    if (apiKeyInput && window.agent) apiKeyInput.value = window.agent.apiKey;
    if (modelSelect && window.agent) modelSelect.value = window.agent.model;
    if (clientIdInput && window.auth) clientIdInput.value = window.auth.clientId;

    if (saveSettingsBtn) {
      saveSettingsBtn.onclick = () => {
        if (window.agent) {
          window.agent.setApiKey(apiKeyInput.value);
          window.agent.setModel(modelSelect.value);
        }
        if (window.auth) {
          window.auth.setClientId(clientIdInput.value);
        }
        alert('Settings saved successfully!');
        modal.classList.remove('active');
      };
    }

    if (demoLoginBtn) {
      demoLoginBtn.onclick = () => {
        const name = prompt('Enter your name for Google Developer profile:', 'Harish Vyas') || 'Google Developer';
        window.auth.loginWithDemoGoogle(name);
        modal.classList.remove('active');
      };
    }

    if (signOutBtn) {
      signOutBtn.onclick = () => {
        window.auth.signOut();
        modal.classList.remove('active');
      };
    }
  }

  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('active');
  }

  initPWA() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new AntigravityApp();
  window.app.init();
});
