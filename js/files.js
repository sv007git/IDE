// Antigravity IDE - File System & Dual-Mode Workspace Manager
// Supports:
// 1. Native Phone Storage (via local backend /api/files, /api/file)
// 2. Offline / Standalone Virtual LocalStorage fallback

const STORAGE_KEY = 'antigravity_workspace_v1';

class FileSystem {
  constructor() {
    this.files = {};
    this.activeFile = 'index.html';
    this.isNative = false;
    this.apiBase = '';
  }

  async init(apiBase = '') {
    this.apiBase = apiBase;
    if (this.apiBase !== null) {
      try {
        const res = await fetch(`${this.apiBase}/api/files`, { cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.files)) {
            this.isNative = true;
            this.files = {};
            for (const f of data.files) {
              this.files[f.name] = ''; // Will load content on demand or prefetch
            }
            if (data.files.length > 0) {
              this.activeFile = data.files[0].name;
              await this.loadNativeFileContent(this.activeFile);
            }
            return true;
          }
        }
      } catch (e) {
        // Fallback to offline mode
      }
    }

    this.isNative = false;
    this.loadVirtual();
    return false;
  }

  loadVirtual() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.files = JSON.parse(stored);
      } else {
        this.files = {
          'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phone App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>⚡ Antigravity IDE</h1>
  <p>Running in Web Sandbox mode.</p>
  <p>To use your phone's native Linux resources and Antigravity CLI, run <code>node server.js</code> in Termux!</p>
</body>
</html>`,
          'style.css': `body { background: #0b0f17; color: #f1f5f9; font-family: sans-serif; padding: 20px; }`,
          'script.js': `console.log("Antigravity loaded!");`,
          'main.py': `# Run real Python on your phone via Termux or in-browser Pyodide\nprint("Hello from Antigravity!")`,
          'README.md': `# Antigravity Mobile Web IDE\n\nRun 'bash setup-android.sh' on your phone to connect native Linux hardware resources.`
        };
        this.persistVirtual();
      }
    } catch (e) {
      this.files = {};
    }

    if (!this.files[this.activeFile]) {
      this.activeFile = Object.keys(this.files)[0] || 'index.html';
    }
  }

  persistVirtual() {
    if (!this.isNative) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.files));
      } catch (e) {}
    }
  }

  async loadNativeFileContent(filename) {
    try {
      const res = await fetch(`${this.apiBase}/api/file/read?name=${encodeURIComponent(filename)}`);
      if (res.ok) {
        const data = await res.json();
        this.files[filename] = data.content || '';
        return this.files[filename];
      }
    } catch (e) {
      console.error('Failed to load native file', e);
    }
    return '';
  }

  getFile(filename) {
    return this.files[filename] ?? '';
  }

  async saveFile(filename, content) {
    this.files[filename] = content;
    if (this.isNative) {
      try {
        await fetch(`${this.apiBase}/api/file/write`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: filename, content })
        });
      } catch (e) {
        console.error('Failed to save native file', e);
      }
    } else {
      this.persistVirtual();
    }
  }

  async createFile(filename, content = '') {
    if (!filename) return false;
    filename = filename.trim();
    if (this.files[filename] !== undefined) {
      alert(`File "${filename}" already exists.`);
      return false;
    }

    this.files[filename] = content;
    this.activeFile = filename;

    if (this.isNative) {
      try {
        await fetch(`${this.apiBase}/api/file/write`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: filename, content })
        });
      } catch (e) {
        console.error('Failed to create native file', e);
      }
    } else {
      this.persistVirtual();
    }
    return true;
  }

  async deleteFile(filename) {
    if (Object.keys(this.files).length <= 1) {
      alert('Cannot delete the last remaining file.');
      return false;
    }

    delete this.files[filename];
    if (this.activeFile === filename) {
      this.activeFile = Object.keys(this.files)[0];
    }

    if (this.isNative) {
      try {
        await fetch(`${this.apiBase}/api/file/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: filename })
        });
      } catch (e) {
        console.error('Failed to delete native file', e);
      }
    } else {
      this.persistVirtual();
    }
    return true;
  }

  async renameFile(oldName, newName) {
    if (!newName || newName === oldName) return false;
    newName = newName.trim();
    if (this.files[newName] !== undefined) {
      alert(`A file named "${newName}" already exists.`);
      return false;
    }

    this.files[newName] = this.files[oldName];
    delete this.files[oldName];
    if (this.activeFile === oldName) {
      this.activeFile = newName;
    }

    if (this.isNative) {
      try {
        await fetch(`${this.apiBase}/api/file/rename`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldName, newName })
        });
      } catch (e) {
        console.error('Failed to rename native file', e);
      }
    } else {
      this.persistVirtual();
    }
    return true;
  }

  async refresh() {
    if (this.isNative) {
      try {
        const res = await fetch(`${this.apiBase}/api/files`);
        if (res.ok) {
          const data = await res.json();
          this.files = {};
          for (const f of data.files) {
            this.files[f.name] = '';
          }
          if (this.activeFile && this.files[this.activeFile] !== undefined) {
            await this.loadNativeFileContent(this.activeFile);
          } else if (data.files.length > 0) {
            this.activeFile = data.files[0].name;
            await this.loadNativeFileContent(this.activeFile);
          }
        }
      } catch (e) {}
    }
  }
}

window.fs = new FileSystem();
