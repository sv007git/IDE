// Antigravity IDE - Mobile Interactive Terminal Emulator
class MobileTerminal {
  constructor() {
    this.history = [];
    this.historyIndex = -1;
    this.container = null;
    this.input = null;
  }

  init() {
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

    this.log('Antigravity Mobile Terminal v1.0.0 (x86_64-wasm-mobile)', 'info');
    this.log('Type "help" for available commands.', 'info');
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

  execute(cmdLine) {
    this.log(`$ ${cmdLine}`, 'cmd');
    const parts = cmdLine.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        this.log('Available Commands:');
        this.log('  run                 - Execute current active project or file');
        this.log('  ls                  - List files in virtual workspace');
        this.log('  cat <file>          - Display contents of a file');
        this.log('  touch <file>        - Create a new file');
        this.log('  rm <file>           - Remove a file');
        this.log('  python <file>       - Run Python script via Pyodide');
        this.log('  agent <prompt>      - Query Antigravity AI Agent');
        this.log('  export              - Export project as .zip file');
        this.log('  clear               - Clear terminal screen');
        this.log('  sysinfo             - Show system & storage info');
        this.log('  about               - About Antigravity IDE');
        break;

      case 'clear':
        this.clear();
        break;

      case 'ls':
        const files = Object.keys(window.fs?.files || {});
        if (files.length === 0) {
          this.log('(no files in workspace)');
        } else {
          files.forEach(f => {
            const isPy = f.endsWith('.py');
            const isHtml = f.endsWith('.html');
            this.log(`  ${isPy ? '🐍' : isHtml ? '🌐' : '📄'} ${f}`);
          });
        }
        break;

      case 'cat':
        if (!args[0]) {
          this.log('Usage: cat <filename>', 'error');
        } else if (window.fs?.files[args[0]] !== undefined) {
          this.log(window.fs.getFile(args[0]));
        } else {
          this.log(`File not found: ${args[0]}`, 'error');
        }
        break;

      case 'touch':
        if (!args[0]) {
          this.log('Usage: touch <filename>', 'error');
        } else {
          const ok = window.fs?.createFile(args[0], '');
          if (ok) {
            this.log(`Created ${args[0]}`, 'success');
            if (window.app) window.app.renderFileList();
          }
        }
        break;

      case 'rm':
        if (!args[0]) {
          this.log('Usage: rm <filename>', 'error');
        } else {
          const ok = window.fs?.deleteFile(args[0]);
          if (ok) {
            this.log(`Removed ${args[0]}`, 'success');
            if (window.app) window.app.renderFileList();
            if (window.editorManager) window.editorManager.loadFile(window.fs.activeFile);
          }
        }
        break;

      case 'run':
        if (window.runner) {
          window.runner.runActive();
        }
        break;

      case 'python':
        const pyFile = args[0] || (window.fs?.activeFile.endsWith('.py') ? window.fs.activeFile : 'main.py');
        if (window.fs?.files[pyFile] !== undefined) {
          if (window.runner) {
            window.runner.runPython(window.fs.getFile(pyFile), pyFile);
          }
        } else {
          this.log(`Python file not found: ${pyFile}`, 'error');
        }
        break;

      case 'agent':
        const query = args.join(' ');
        if (!query) {
          this.log('Usage: agent <your coding question or task>', 'error');
        } else {
          this.log(`Forwarding query to Antigravity Agent: "${query}"...`, 'info');
          if (window.app) window.app.switchPanel('agent');
          if (window.agent) window.agent.sendPrompt(query);
        }
        break;

      case 'export':
        if (window.fs) {
          window.fs.exportZip();
          this.log('Generated project ZIP download.', 'success');
        }
        break;

      case 'sysinfo':
        this.log(`Platform: ${navigator.userAgent}`);
        this.log(`Viewport: ${window.innerWidth} x ${window.innerHeight} (dpr: ${window.devicePixelRatio})`);
        this.log(`Active File: ${window.fs?.activeFile || 'none'}`);
        const totalChars = Object.values(window.fs?.files || {}).reduce((acc, c) => acc + c.length, 0);
        this.log(`Workspace Size: ${(totalChars / 1024).toFixed(2)} KB`);
        this.log(`Google Auth: ${window.auth?.user ? 'Signed in as ' + window.auth.user.name : 'Not signed in'}`);
        break;

      case 'about':
        this.log('Google Antigravity IDE (Web & Mobile edition)');
        this.log('Agent-first cloud IDE built for mobile phones, tablets, and desktops.');
        this.log('Repository: https://github.com/sv007git/IDE');
        this.log('Powered by Gemini & Pyodide.');
        break;

      default:
        this.log(`Command not found: ${cmd}. Type "help" for a list of commands.`, 'error');
    }
  }
}

window.terminal = new MobileTerminal();
