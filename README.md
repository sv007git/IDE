# Antigravity IDE (Mobile & Web)

An AI-first development environment powered by **Google Antigravity CLI (`agy`)**, engineered specifically for **Android mobile phones** (Linux subsystem) and web browsers.

🌐 **Live GitHub Pages URL**: [https://sv007git.github.io/IDE/](https://sv007git.github.io/IDE/)  
📦 **GitHub Repository**: [https://github.com/sv007git/IDE](https://github.com/sv007git/IDE)

---

## ⚡ Using Your Phone's Native Hardware Resources

Android is built on the Linux kernel. With **Termux** or a proot Linux distro, your phone has access to:
* **8-core ARM64 CPU & 6-12 GB RAM**
* **Native Linux Bash/Zsh shell**
* **Local physical filesystem storage**
* **Full compiler & package toolchains (`pkg`, `apt`, `python`, `node`, `clang`, `git`)**
* **Official Native Google Antigravity CLI (`agy`)**

A static website on GitHub Pages runs in a restricted browser sandbox. **To use your phone's actual hardware and Antigravity CLI, run the native engine directly on your phone!**

---

## 🚀 1-Step Setup on Android (Termux)

### Step 1: Open Termux on your phone
If you don't have Termux, download it from [F-Droid](https://f-droid.org/packages/com.termux/) or GitHub Releases (do not use the deprecated Google Play Store version).

### Step 2: Run the Antigravity Setup 1-Liner
Copy and paste this single command into Termux:

```bash
curl -fsSL https://raw.githubusercontent.com/sv007git/IDE/main/setup-android.sh | bash
```

**What this automatically does:**
1. Installs Node.js, Git, Python, and Curl on your phone.
2. Installs the **official Google Antigravity CLI (`agy`)** (Google's native `android_arm64` Bionic build).
3. Clones `sv007git/IDE` into `$HOME/antigravity-ide`.
4. Adds a global `antigravity-ide` launcher command to your phone's path.
5. Launches the local native server on **`http://localhost:3000`**.

### Step 3: Open the IDE in Android Chrome
1. Open Chrome on your phone and go to:
   👉 **`http://localhost:3000`**
2. Tap the Chrome menu (**⋮**) -> **"Install App"** (or **"Add to Home screen"**).
3. The Antigravity IDE launches full-screen with a **`🟢 Phone (arm64)`** badge in the header.

---

## 🛠 Features in Phone Native Mode

When running with `antigravity-ide` on your phone:

| Feature | Phone Native Mode | Static Web Sandbox |
| :--- | :--- | :--- |
| **Computing Hardware** | **Your phone's physical ARM64 CPU & RAM** | Browser JavaScript engine |
| **Filesystem** | **Real files on phone storage (`~/antigravity-ide/workspace`)** | Browser `localStorage` (virtual) |
| **Terminal Shell** | **Real Linux Bash (`/bin/sh` / Termux bash)** | Browser mock emulator |
| **Antigravity Engine** | **Official Google Antigravity CLI (`agy`)** | Gemini API or offline templates |
| **Package Managers** | `pkg`, `apt`, `pip`, `npm`, `cargo` | None |
| **Google Sign-In** | CLI Device Auth + Google Identity | Google Identity Services |

### 1. Real Native Terminal on Phone
In the **Terminal** tab of the IDE:
- Run any Linux command: `uname -a`, `top`, `git status`, `python main.py`, `npm run dev`.
- Run `agy` directly or check its status: `agy status`.
- Install packages natively: `pkg install clang`, `pip install numpy`.

### 2. Antigravity AI Agent (`agy`)
In the **Agent** tab of the IDE:
- All prompts are sent directly to the **official Google Antigravity CLI (`agy -p "..."`)** running on your phone.
- The agent has real-time tool access to read, modify, and build code directly in your phone's project workspace.
- Multi-step reasoning and file modifications stream live into the chat with one-tap code applications.

### 3. Touch-Optimized Mobile Keyboard Toolbar
Coding on an on-screen keyboard is usually difficult because symbols like `{`, `}`, `[`, `]`, `=>`, `;` are buried behind submenus.
* The IDE has a persistent quick-access bar directly above the Android virtual keyboard:
  `{ }` `( )` `[ ]` `;` `:` `=` `=>` `<` `>` `/` `+` `-` `!` `?` `$` `Tab` `Undo` `Redo`
* Tapping bracket buttons automatically inserts both opening and closing brackets and centers your cursor inside.

---

## 🔐 Google Sign-In with Antigravity CLI

Google Antigravity CLI authenticates your Google account via browser device flow:

1. In Termux (or the IDE terminal), run:
   ```bash
   agy login
   ```
2. The CLI will display an authorization link.
3. Open the link in Android Chrome, sign in with your Google Account, and authorize.
4. Your Antigravity CLI session is now authenticated on your phone and ready for unlimited agent assistance.

---

## 💻 Alternative: Running Full VS Code (Code-Server) on Android

If you prefer a desktop-style VS Code layout on your Android tablet or phone:

1. In Termux, install `code-server`:
   ```bash
   pkg install -y tur-repo
   pkg install -y code-server
   ```
2. Start it:
   ```bash
   code-server --auth none --port 8080
   ```
3. Open `http://localhost:8080` in Chrome.
4. Open the built-in terminal inside VS Code and run `agy`!

---

## 🌐 Dual-Mode: Static Cloud Hosting (GitHub Pages)

The repository continues to be deployed live on **GitHub Pages**:
* URL: [https://sv007git.github.io/IDE/](https://sv007git.github.io/IDE/)
* When opened on a PC or device without the local phone server running, it operates in **Standalone Web Sandbox** mode (using client-side Pyodide WebAssembly and Gemini API).
* When opened on your phone where `antigravity-ide` (or `node server.js`) is running, it automatically bridges to your phone's native resources!
