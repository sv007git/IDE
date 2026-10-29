// Antigravity IDE - Editor Controller & Mobile Keyboard Bar
class EditorManager {
  constructor() {
    this.editor = null;
    this.saveTimeout = null;
    this.activeTabs = ['index.html', 'style.css', 'script.js'];
  }

  init() {
    const textarea = document.getElementById('code-editor');
    if (!textarea) return;

    this.editor = CodeMirror.fromTextArea(textarea, {
      lineNumbers: true,
      mode: 'htmlmixed',
      theme: 'material-darker',
      tabSize: 2,
      indentUnit: 2,
      lineWrapping: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      inputStyle: 'contenteditable' // crucial for Android virtual keyboard compatibility
    });

    // Auto-save on change (debounced 400ms)
    this.editor.on('change', () => {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => {
        if (window.fs && window.fs.activeFile) {
          window.fs.saveFile(window.fs.activeFile, this.editor.getValue());
          this.updateSaveIndicator(true);
        }
      }, 400);
    });

    this.initMobileToolbar();
    this.loadFile(window.fs.activeFile);
    this.renderTabs();
  }

  updateSaveIndicator(saved) {
    const el = document.getElementById('save-status');
    if (el) {
      el.textContent = saved ? 'Saved' : 'Saving...';
      el.style.opacity = saved ? '0.6' : '1';
    }
  }

  getModeForFile(filename) {
    if (filename.endsWith('.html') || filename.endsWith('.htm')) return 'htmlmixed';
    if (filename.endsWith('.js') || filename.endsWith('.mjs')) return 'javascript';
    if (filename.endsWith('.json')) return { name: 'javascript', json: true };
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.py')) return 'python';
    if (filename.endsWith('.md')) return 'markdown';
    return 'text/plain';
  }

  loadFile(filename) {
    if (!this.editor || !window.fs) return;
    const content = window.fs.getFile(filename);
    const mode = this.getModeForFile(filename);

    this.editor.setValue(content);
    this.editor.setOption('mode', mode);
    this.editor.clearHistory();

    if (!this.activeTabs.includes(filename)) {
      this.activeTabs.push(filename);
    }
    this.renderTabs();

    const titleEl = document.getElementById('current-file-title');
    if (titleEl) titleEl.textContent = filename;
  }

  renderTabs() {
    const tabsContainer = document.getElementById('editor-tabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';
    this.activeTabs.forEach(file => {
      const tab = document.createElement('div');
      tab.className = `tab-item ${file === window.fs.activeFile ? 'active' : ''}`;
      
      const label = document.createElement('span');
      label.textContent = file;
      label.onclick = () => {
        window.fs.activeFile = file;
        this.loadFile(file);
      };

      const close = document.createElement('span');
      close.className = 'tab-close-btn';
      close.innerHTML = '&times;';
      close.onclick = (e) => {
        e.stopPropagation();
        this.closeTab(file);
      };

      tab.appendChild(label);
      tab.appendChild(close);
      tabsContainer.appendChild(tab);
    });
  }

  closeTab(file) {
    if (this.activeTabs.length <= 1) return;
    this.activeTabs = this.activeTabs.filter(f => f !== file);
    if (window.fs.activeFile === file) {
      window.fs.activeFile = this.activeTabs[0];
      this.loadFile(window.fs.activeFile);
    } else {
      this.renderTabs();
    }
  }

  initMobileToolbar() {
    const toolbar = document.getElementById('mobile-code-toolbar');
    if (!toolbar) return;

    const keys = [
      { label: 'Tab', action: () => this.insertText('  ') },
      { label: '{ }', action: () => this.wrapText('{', '}') },
      { label: '( )', action: () => this.wrapText('(', ')') },
      { label: '[ ]', action: () => this.wrapText('[', ']') },
      { label: '" "', action: () => this.wrapText('"', '"') },
      { label: "' '", action: () => this.wrapText("'", "'") },
      { label: '` `', action: () => this.wrapText('`', '`') },
      { label: ';', action: () => this.insertText(';') },
      { label: ':', action: () => this.insertText(':') },
      { label: '=', action: () => this.insertText(' = ') },
      { label: '=>', action: () => this.insertText(' => ') },
      { label: '<', action: () => this.insertText('<') },
      { label: '>', action: () => this.insertText('>') },
      { label: '/', action: () => this.insertText('/') },
      { label: '+', action: () => this.insertText(' + ') },
      { label: '-', action: () => this.insertText(' - ') },
      { label: '!', action: () => this.insertText('!') },
      { label: '?', action: () => this.insertText('?') },
      { label: '$', action: () => this.insertText('$') },
      { label: 'Undo', action: () => this.editor.undo() },
      { label: 'Redo', action: () => this.editor.redo() }
    ];

    toolbar.innerHTML = '';
    keys.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'code-key-btn';
      btn.type = 'button';
      btn.textContent = k.label;
      btn.onmousedown = (e) => e.preventDefault(); // keep editor focused
      btn.onclick = (e) => {
        e.preventDefault();
        k.action();
        this.editor.focus();
      };
      toolbar.appendChild(btn);
    });
  }

  insertText(text) {
    if (!this.editor) return;
    const doc = this.editor.getDoc();
    const cursor = doc.getCursor();
    doc.replaceRange(text, cursor);
  }

  wrapText(open, close) {
    if (!this.editor) return;
    const doc = this.editor.getDoc();
    const selection = doc.getSelection();
    if (selection.length > 0) {
      doc.replaceSelection(open + selection + close);
    } else {
      const cursor = doc.getCursor();
      doc.replaceRange(open + close, cursor);
      doc.setCursor({ line: cursor.line, ch: cursor.ch + open.length });
    }
  }

  getContent() {
    return this.editor ? this.editor.getValue() : '';
  }

  setContent(text) {
    if (this.editor) {
      this.editor.setValue(text);
      if (window.fs && window.fs.activeFile) {
        window.fs.saveFile(window.fs.activeFile, text);
      }
    }
  }
}

window.editorManager = new EditorManager();
