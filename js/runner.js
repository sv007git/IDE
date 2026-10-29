// Antigravity IDE - Code Runner (Web Sandbox & Pyodide Python Engine)
class CodeRunner {
  constructor() {
    this.pyodide = null;
    this.pyodideLoading = false;
  }

  runActive() {
    const activeFile = window.fs?.activeFile || 'index.html';
    if (activeFile.endsWith('.py')) {
      this.runPython(window.fs.getFile(activeFile), activeFile);
    } else {
      this.runWeb();
    }
  }

  runWeb() {
    const iframe = document.getElementById('preview-frame');
    if (!iframe) return;

    let html = window.fs?.getFile('index.html') || '<h1>No index.html found</h1>';
    const css = window.fs?.getFile('style.css') || '';
    const js = window.fs?.getFile('script.js') || '';

    // Inject CSS
    if (css) {
      html = html.replace('</head>', `<style>\n${css}\n</style></head>`);
    }

    // Intercept console.log and forward to IDE terminal
    const consoleInterceptor = `
    <script>
      (function() {
        const _log = console.log;
        const _warn = console.warn;
        const _error = console.error;
        const _info = console.info;

        function sendToTerminal(type, args) {
          try {
            const msg = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
            window.parent.postMessage({ source: 'antigravity_runner', type, msg }, '*');
          } catch(e) {}
        }

        console.log = function(...args) { sendToTerminal('log', args); _log.apply(console, args); };
        console.warn = function(...args) { sendToTerminal('warn', args); _warn.apply(console, args); };
        console.error = function(...args) { sendToTerminal('error', args); _error.apply(console, args); };
        console.info = function(...args) { sendToTerminal('info', args); _info.apply(console, args); };

        window.onerror = function(msg, url, line) {
          sendToTerminal('error', [\`Uncaught Error: \${msg} (line \${line})\`]);
        };
      })();
    </script>
    `;

    // Inject Script & Interceptor
    html = html.replace('</body>', `${consoleInterceptor}<script>\n${js}\n</script></body>`);

    iframe.srcdoc = html;

    if (window.terminal) {
      window.terminal.log('⚡ Web Sandbox launched successfully.', 'success');
    }
  }

  async runPython(code, filename = 'main.py') {
    if (window.terminal) {
      window.terminal.log(`▶ Executing Python script: ${filename}`, 'cmd');
    }

    // Switch to terminal tab so user sees the output on mobile
    if (window.app) {
      window.app.switchPanel('terminal');
    }

    try {
      if (!this.pyodide) {
        if (!this.pyodideLoading) {
          this.pyodideLoading = true;
          if (window.terminal) {
            window.terminal.log('⏳ Initializing Pyodide Python WebAssembly environment...', 'info');
          }
          await this.loadPyodideScript();
          this.pyodide = await window.loadPyodide({
            stdout: (text) => {
              if (window.terminal) window.terminal.log(text);
            },
            stderr: (text) => {
              if (window.terminal) window.terminal.log(text, 'error');
            }
          });
          this.pyodideLoading = false;
          if (window.terminal) {
            window.terminal.log('✓ Pyodide engine ready.', 'success');
          }
        } else {
          if (window.terminal) {
            window.terminal.log('⏳ Pyodide is currently initializing, please wait a moment...', 'info');
          }
          return;
        }
      }

      const startTime = performance.now();
      await this.pyodide.runPythonAsync(code);
      const duration = (performance.now() - startTime).toFixed(1);

      if (window.terminal) {
        window.terminal.log(`✓ Finished in ${duration}ms`, 'success');
      }
    } catch (err) {
      if (window.terminal) {
        window.terminal.log(`Traceback (most recent call last):\n${err.message}`, 'error');
      }
    }
  }

  loadPyodideScript() {
    return new Promise((resolve, reject) => {
      if (window.loadPyodide) return resolve();
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Pyodide script'));
      document.head.appendChild(script);
    });
  }
}

// Global message listener for iframe console logs
window.addEventListener('message', (event) => {
  if (event.data && event.data.source === 'antigravity_runner') {
    if (window.terminal) {
      const type = event.data.type === 'error' ? 'error' : event.data.type === 'warn' ? 'info' : '';
      window.terminal.log(`[console.${event.data.type}] ${event.data.msg}`, type);
    }
  }
});

window.runner = new CodeRunner();
