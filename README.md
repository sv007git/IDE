# Antigravity IDE (Mobile & Web)

An AI-first, mobile-optimized development environment inspired by **Google Antigravity**, built specifically for Android mobile and desktop web browsers.

🌐 **Live URL**: [https://sv007git.github.io/IDE/](https://sv007git.github.io/IDE/)  
📦 **Repository**: [https://github.com/sv007git/IDE](https://github.com/sv007git/IDE)

---

## 📱 Designed for Android Mobile

Coding on a phone usually suffers from cramped UI, virtual keyboards hiding brackets, and awkward navigation. **Antigravity IDE solves this**:

1. **Quick-Code Accessory Toolbar**:
   - Touch buttons for symbols frequently hidden on mobile keyboards: `{ }`, `( )`, `[ ]`, `;`, `:`, `=`, `=>`, `<`, `>`, `+`, `-`, `!`, `?`, `$`, `Tab`, `Undo`, `Redo`.
   - Single tap auto-inserts matching brackets and positions cursor in between.
2. **Mobile Bottom Navigation**:
   - One-tap switching between **Files**, **Editor**, **AI Agent**, **Preview**, and **Terminal**.
3. **PWA Standalone Fullscreen (Add to Home Screen)**:
   - On Android Chrome, open `https://sv007git.github.io/IDE/` and tap **"Install App"** or **"Add to Home screen"**.
   - Opens as a native full-screen app without browser URL bars, maximizing code area.
4. **Touch-Friendly Controls**:
   - Clean gesture spacing, responsive virtual drawers, and prevention of double-tap unwanted browser zooming.

---

## 🔐 Google Sign-In Integration

The IDE includes **Google Identity Services (GSI)**:

- **Sign In with Google**: Authenticates your Google account and displays your user avatar and profile in the header.
- **Quick Connect**: Instant 1-tap connection for developer testing.
- **Custom Google OAuth Client ID**:
  1. Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
  2. Create an **OAuth 2.0 Client ID** (Web application).
  3. Under **Authorized JavaScript origins**, add:
     `https://sv007git.github.io`
  4. Paste the Client ID into IDE **Settings ⚙️ -> Google OAuth Client ID** and click Save.

---

## 🤖 Antigravity AI Agent (Gemini Integration)

The IDE features an AI pair programmer styled after **Google Antigravity**:

- **Live Gemini Engine**: Add your free Google AI Studio API key in **Settings** to run **Gemini 2.5 Flash**, **Gemini 1.5 Flash**, or **Gemini 1.5 Pro**.
- **Offline Agent**: Works immediately out-of-the-box with built-in code analysis, bug detection, and templates even without an API key!
- **1-Tap Code Application**: Click **"⚡ Apply to Editor"** on any code suggestion in the AI chat to instantly write it into your active file.

---

## ⚡ Execution Engines

### 1. Web Sandbox Preview
- Live execution of HTML5, CSS3, and modern JavaScript.
- Automatic console log interception: all `console.log`, `console.warn`, and `console.error` calls stream directly into the IDE Terminal.

### 2. Python Runner (Pyodide WebAssembly)
- Runs real Python 3 directly in your Android phone browser without any backend server.
- Supports math, algorithms, data structures, and Python standard libraries.
- Prints directly to the mobile terminal.

### 3. Mobile Terminal
- Command emulator with built-in commands:
  - `run`: Execute active file
  - `python <filename>`: Run Python script
  - `agent <query>`: Ask Antigravity AI Agent
  - `ls`, `cat`, `touch`, `rm`: Virtual file system operations
  - `export`: Download complete workspace as a `.zip` archive
  - `sysinfo`, `clear`, `about`

---

## 🚀 GitHub Pages Setup

This repository is pre-configured with:
- Automated GitHub Actions workflow (`.github/workflows/pages.yml`)
- Standalone relative paths (`./`) compatible with GitHub Pages subpath hosting.

### Enabling GitHub Pages in GitHub:
1. Navigate to [https://github.com/sv007git/IDE/settings/pages](https://github.com/sv007git/IDE/settings/pages).
2. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions** (or select **Deploy from a branch** -> branch: `main`, folder: `/ (root)`).
3. Your IDE will be live at:
   👉 **`https://sv007git.github.io/IDE/`**

---

## 🛠 Local Development
To test locally:
```bash
# Using python built-in server
python -m http.server 8000
# Open http://localhost:8000 in your browser or mobile emulator
```
