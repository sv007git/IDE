// Antigravity IDE - Virtual File System & Workspace Storage
const STORAGE_KEY = 'antigravity_workspace_v1';

const DEFAULT_FILES = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Antigravity App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="card">
    <div class="logo">⚡</div>
    <h1>Welcome to Antigravity IDE</h1>
    <p>AI-first mobile development environment running live in your browser.</p>
    
    <div class="counter-box">
      <button id="btn-count">Clicked <span id="count">0</span> times</button>
    </div>

    <div class="status-indicator">
      <span class="dot"></span> Mobile Live Sandbox Active
    </div>
  </div>

  <script src="script.js"></script>
</body>
</html>`,

  'style.css': `body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #1e293b, #0f172a);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f8fafc;
  padding: 16px;
  box-sizing: border-box;
}

.card {
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 28px 24px;
  border-radius: 20px;
  text-align: center;
  max-width: 380px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.logo {
  font-size: 2.5rem;
  margin-bottom: 12px;
  filter: drop-shadow(0 0 16px #38bdf8);
}

h1 {
  font-size: 1.4rem;
  margin: 0 0 8px;
  background: linear-gradient(135deg, #38bdf8, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 20px;
}

.counter-box button {
  background: linear-gradient(135deg, #0284c7, #38bdf8);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(56, 189, 248, 0.3);
  transition: transform 0.1s ease;
}

.counter-box button:active {
  transform: scale(0.96);
}

.status-indicator {
  margin-top: 24px;
  font-size: 0.75rem;
  color: #38bdf8;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #34d399;
  border-radius: 50%;
  box-shadow: 0 0 8px #34d399;
}`,

  'script.js': `// Antigravity interactive client script
console.log("Antigravity Client loaded successfully!");

let count = 0;
const countBtn = document.getElementById('btn-count');
const countSpan = document.getElementById('count');

if (countBtn && countSpan) {
  countBtn.addEventListener('click', () => {
    count++;
    countSpan.textContent = count;
    console.log(\`Counter incremented to \${count}\`);
  });
}`,

  'main.py': `# Python code runner on Android via Pyodide
import math

def calculate_antigravity_vector(mass, altitude):
    G = 6.67430e-11 # Gravitational constant
    M_earth = 5.972e24 # Mass of Earth (kg)
    R_earth = 6.371e6 # Radius of Earth (m)
    
    r = R_earth + altitude
    g = (G * M_earth) / (r ** 2)
    weight = mass * g
    
    return {
        "altitude_km": altitude / 1000,
        "effective_g": round(g, 4),
        "force_newtons": round(weight, 2)
    }

print("=== Antigravity Physics Engine ===")
for alt in [0, 10000, 100000, 400000]:
    stats = calculate_antigravity_vector(75, alt)
    print(f"Altitude: {stats['altitude_km']} km | Gravity: {stats['effective_g']} m/s² | Weight: {stats['force_newtons']} N")

print("\\nSimulated orbit completed successfully!")`,

  'README.md': `# Antigravity Mobile Web IDE

A lightweight, agentic Web IDE designed for Android mobile and desktop browsers.

## Key Features
- **Mobile First**: Optimized touch controls, virtual keyboard accessory toolbar for fast syntax typing.
- **Google Sign-In**: Integrated with Google Identity Services.
- **Antigravity AI Agent**: Natural language assistant, code generation, refactoring, and planning powered by Gemini.
- **Live Sandbox & Runner**: Live preview for HTML/CSS/JS and in-browser Python execution via Pyodide.
- **PWA Ready**: Install on your Android Home Screen for full-screen offline development.
- **Hosted on GitHub Pages**: Pushed directly to \`sv007git/IDE\`.`
};

class FileSystem {
  constructor() {
    this.files = {};
    this.activeFile = 'index.html';
    this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.files = JSON.parse(stored);
      } else {
        this.files = { ...DEFAULT_FILES };
        this.persist();
      }
    } catch (e) {
      console.warn('Failed to load workspace from localStorage, using defaults', e);
      this.files = { ...DEFAULT_FILES };
    }

    if (!this.files[this.activeFile]) {
      this.activeFile = Object.keys(this.files)[0] || 'index.html';
    }
  }

  persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.files));
    } catch (e) {
      console.error('Failed to persist files', e);
    }
  }

  getFile(filename) {
    return this.files[filename] ?? '';
  }

  saveFile(filename, content) {
    this.files[filename] = content;
    this.persist();
  }

  createFile(filename, content = '') {
    if (!filename) return false;
    filename = filename.trim();
    if (this.files[filename] !== undefined) {
      alert(`File "${filename}" already exists.`);
      return false;
    }
    this.files[filename] = content;
    this.activeFile = filename;
    this.persist();
    return true;
  }

  deleteFile(filename) {
    if (Object.keys(this.files).length <= 1) {
      alert('Cannot delete the last remaining file.');
      return false;
    }
    delete this.files[filename];
    if (this.activeFile === filename) {
      this.activeFile = Object.keys(this.files)[0];
    }
    this.persist();
    return true;
  }

  renameFile(oldName, newName) {
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
    this.persist();
    return true;
  }

  resetToDefaults() {
    this.files = { ...DEFAULT_FILES };
    this.activeFile = 'index.html';
    this.persist();
  }

  exportZip(filename = 'antigravity-project.zip') {
    if (typeof JSZip === 'undefined') {
      alert('ZIP library is loading. Please try again.');
      return;
    }
    const zip = new JSZip();
    for (const [name, content] of Object.entries(this.files)) {
      zip.file(name, content);
    }
    zip.generateAsync({ type: 'blob' }).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
}

window.fs = new FileSystem();
