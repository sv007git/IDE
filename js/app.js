// Antigravity IDE - Master Application Controller
class AntigravityApp {
  constructor() {
    this.currentPanel = 'editor';
  }

  init() {
    // Initialize components
    if (window.editorManager) window.editorManager.init();
    if (window.terminal) window.terminal.init();
    if (window.auth) window.auth.updateUI();

    this.initNavigation();
    this.initHeaderActions();
    this.initFileExplorer();
    this.initAgentChat();
    this.initSettingsModal();
    this.initPWA();

    // Default to editor on load
    this.switchPanel('editor');
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

    // Update bottom nav buttons
    document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(item => {
      if (item.getAttribute('data-panel') === panelId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update panels
    document.querySelectorAll('.panel').forEach(panel => {
      if (panel.id === `panel-${panelId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Panel-specific actions
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
    // Run button
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

    // Agent quick button
    const agentBtn = document.getElementById('btn-agent-header');
    if (agentBtn) {
      agentBtn.addEventListener('click', () => {
        this.switchPanel('agent');
      });
    }

    // User Avatar button (opens profile/settings)
    const avatarBtn = document.getElementById('user-avatar-btn');
    if (avatarBtn) {
      avatarBtn.addEventListener('click', () => {
        this.openSettingsModal();
      });
    }

    // Fullscreen toggle (crucial for mobile Android)
    const fsBtn = document.getElementById('btn-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          fsBtn.innerHTML = '⛶';
        } else {
          document.exitFullscreen().catch(() => {});
          fsBtn.innerHTML = '⛶';
        }
      });
    }
  }

  initFileExplorer() {
    this.renderFileList();

    // New File button
    const newFileBtn = document.getElementById('btn-new-file');
    if (newFileBtn) {
      newFileBtn.addEventListener('click', () => {
        const filename = prompt('Enter new filename (e.g., app.js, index.html, utils.py):');
        if (filename && window.fs) {
          const ok = window.fs.createFile(filename, '');
          if (ok) {
            this.renderFileList();
            if (window.editorManager) {
              window.editorManager.loadFile(filename);
            }
            this.switchPanel('editor');
          }
        }
      });
    }

    // Export ZIP button
    const exportBtn = document.getElementById('btn-export-zip');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (window.fs) window.fs.exportZip();
      });
    }

    // Import File button
    const importInput = document.getElementById('file-import-input');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          if (window.fs) {
            window.fs.saveFile(file.name, content);
            this.renderFileList();
            if (window.editorManager) window.editorManager.loadFile(file.name);
            this.switchPanel('editor');
          }
        };
        reader.readAsText(file);
        importInput.value = '';
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

      left.onclick = () => {
        window.fs.activeFile = filename;
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
      renameBtn.title = 'Rename';
      renameBtn.onclick = (e) => {
        e.stopPropagation();
        const newName = prompt(`Rename ${filename} to:`, filename);
        if (newName && newName !== filename) {
          window.fs.renameFile(filename, newName);
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
      deleteBtn.title = 'Delete';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete ${filename}?`)) {
          window.fs.deleteFile(filename);
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

    // Add initial welcome message
    if (window.agent) {
      window.agent.addMessage('assistant', `👋 **Hello! I am your Antigravity AI Agent.**\n\nI can help you build apps, write code, refactor functions, or solve bugs directly on your device.\n\n* **Live Gemini AI**: Enter your Gemini API key in Settings to unleash Gemini 2.5 Flash.\n* **Runner**: Tap Run to preview web apps or run Python files with Pyodide.`);
    }
  }

  initSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('btn-close-settings');
    const saveSettingsBtn = document.getElementById('btn-save-settings');
    const resetWorkspaceBtn = document.getElementById('btn-reset-workspace');
    const demoLoginBtn = document.getElementById('btn-demo-login');
    const signOutBtn = document.getElementById('btn-sign-out');

    if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('active');
      };
    }

    // Populate current values
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

    if (resetWorkspaceBtn) {
      resetWorkspaceBtn.onclick = () => {
        if (confirm('Reset all files to default starter project? Any unsaved edits will be replaced.')) {
          window.fs.resetToDefaults();
          this.renderFileList();
          if (window.editorManager) window.editorManager.loadFile('index.html');
          modal.classList.remove('active');
        }
      };
    }

    if (demoLoginBtn) {
      demoLoginBtn.onclick = () => {
        const name = prompt('Enter your name for Google Developer profile:', 'Harish Vyas') || 'Google Developer';
        window.auth.loginWithDemoGoogle(name);
        alert(`Connected as ${name}!`);
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
    if (modal) {
      const apiKeyInput = document.getElementById('setting-gemini-key');
      const modelSelect = document.getElementById('setting-gemini-model');
      const clientIdInput = document.getElementById('setting-google-client-id');

      if (apiKeyInput && window.agent) apiKeyInput.value = window.agent.apiKey;
      if (modelSelect && window.agent) modelSelect.value = window.agent.model;
      if (clientIdInput && window.auth) clientIdInput.value = window.auth.clientId;

      modal.classList.add('active');
    }
  }

  initPWA() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.log('SW registration note:', err);
      });
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new AntigravityApp();
  window.app.init();
});
