// Antigravity IDE - Native Shell & Mobile Terminal Controller
class MobileTerminal {
  constructor() {
    this.history = [];
    this.historyIndex = -1;
    this.container = null;
    this.input = null;
    this.isNative = false;
    this.apiBase = '';
  }

  init(isNative = false, apiBase = '') {
    this.isNative = isNative;
    this.apiBase = apiBase;
    this.container = document.getElementById('terminal-body');
    this.input = document.getElementById('terminal-input');

    if (this.input) {
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const cmd = this.input.value.trim();
          if (cmd) {
            this.history.push(cmd);
            this.historyIndex = this.history.length;
            this.execute(cmd);
            this.input.value = '';
          }
        } else if (e.key === 'ArrowUp') {
          if (this.historyIndex > 0) {
            this.historyIndex--;
            this.input.value = this.history[this.historyIndex] || '';
          }
        } else if (e.key === 'ArrowDown') {
          if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.input.value = this.history[this.historyIndex] || '';
          } else {
            this.historyIndex = this.history.length;
            this.input.value = '';
          }
        }
      });
    }

    if (this.isNative) {
      this.log('🟢 Connected to Phone Native Linux Subsystem (ARM64)', 'success');
      this.log('Full access to Android hardware, Termux bash, packages, and Antigravity CLI.', 'info');
      this.log('Type any Linux shell command (e.g. "uname -a", "python", "agy --version", "git status")', 'info');
    } else {
      this.log('🟡 Antigravity Web Sandbox (In-Browser Virtual Shell)', 'info');
      this.log('To run on your phone\'s native CPU & bash shell, start "node server.js" in Termux.', 'info');
      this.log('Type "help" for built-in commands.', 'info');
    }
  }

  log(text, type = '') {
    if (!this.container) return;
    const line = document.createElement('div');
    line.className = `term-line ${type}`;
    line.textContent = text;
    this.container.appendChild(line);
    this.container.scrollTop = this.container.scrollHeight;
  }

  clear() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  async execute(cmdLine) {
    this.log(`$ ${cmdLine}`, 'cmd');

    if (cmdLine === 'clear') {
      this.clear();
      return;
    }

    if (this.isNative) {
      // Execute directly on the phone's native bash shell via streaming API
      try {
        const res = await fetch(`${this.apiBase}/api/exec`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmdLine })
        });

        if (!res.ok) {
          const errText = await res.text();
          this.log(`Error: ${errText}`, 'error');
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep last incomplete line
          for (const line of lines) {
            this.log(line);
          }
        }
        if (buffer) this.log(buffer);

        // Refresh file explorer if file command occurred
        if (cmdLine.startsWith('touch') || cmdLine.startsWith('rm') || cmdLine.startsWith('git') || cmdLine.startsWith('mkdir')) {
          if (window.fs && window.fs.refresh) {
            await window.fs.refresh();
            if (window.app) window.app.renderFileList();
          }
        }
      } catch (err) {
        this.log(`Connection Error: ${err.message}`, 'error');
      }
      return;
    }

    // Virtual Sandbox Fallback
    const parts = cmdLine.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        this.log('Available Virtual Commands:');
        this.log('  run                 - Execute current active project or file');
        this.log('  ls                  - List files');
        this.log('  cat <file>          - Display file content');
        this.log('  touch <file>        - Create a file');
        this.log('  rm <file>           - Delete a file');
        this.log('  python <file>       - Run Python in browser via Pyodide');
        this.log('  agent <prompt>      - Query Antigravity AI Agent');
        this.log('  export              - Export project as .zip file');
        this.log('  connect             - Check connection to native Android phone server');
        this.log('  clear               - Clear terminal');
        break;

      case 'connect':
        this.log('Checking local phone server on http://localhost:3000...', 'info');
        if (window.app) window.app.detectBackend();
        break;

      case 'ls':
        const files = Object.keys(window.fs?.files || {});
        files.forEach(f => this.log(`  📄 ${f}`));
        break;

      case 'cat':
        if (!args[0]) this.log('Usage: cat <filename>', 'error');
        else if (window.fs?.files[args[0]] !== undefined) this.log(window.fs.getFile(args[0]));
        else this.log(`File not found: ${args[0]}`, 'error');
        break;

      case 'touch':
        if (args[0] && window.fs) {
          window.fs.createFile(args[0], '');
          this.log(`Created ${args[0]}`, 'success');
          if (window.app) window.app.renderFileList();
        }
        break;

      case 'rm':
        if (args[0] && window.fs) {
          window.fs.deleteFile(args[0]);
          this.log(`Removed ${args[0]}`, 'success');
          if (window.app) window.app.renderFileList();
        }
        break;

      case 'run':
        if (window.runner) window.runner.runActive();
        break;

      case 'python':
        const pyFile = args[0] || (window.fs?.activeFile.endsWith('.py') ? window.fs.activeFile : 'main.py');
        if (window.runner && window.fs?.files[pyFile] !== undefined) {
          window.runner.runPython(window.fs.getFile(pyFile), pyFile);
        } else {
          this.log(`Python file not found: ${pyFile}`, 'error');
        }
        break;

      case 'agent':
        const query = args.join(' ');
        if (window.agent && query) {
          if (window.app) window.app.switchPanel('agent');
          window.agent.sendPrompt(query);
        }
        break;

      default:
        this.log(`Command not recognized in sandbox: ${cmd}. (Run "node server.js" on your phone to unlock full native Linux bash commands).`, 'error');
    }
  }
}

window.terminal = new MobileTerminal();
