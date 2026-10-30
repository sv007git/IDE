#!/bin/bash
# ==============================================================================
# Antigravity IDE - Native Android (Linux) Auto-Installer & Setup Script
# ==============================================================================
# Turns your Android phone into an AI-first development workstation.
# Uses your phone's native ARM64 CPU, RAM, Linux shell, and Google Antigravity CLI ('agy').
# ==============================================================================

set -euo pipefail

echo ""
echo "===================================================================="
echo "⚡ Setting up Antigravity Native Android Development Environment"
echo "===================================================================="
echo ""

# 1. Environment & Package Manager Detection
IS_TERMUX=false
if [ -d "/data/data/com.termux" ] || [ "$(uname -o 2>/dev/null)" = "Android" ]; then
    IS_TERMUX=true
    echo "✓ Detected Android (Termux) environment"
else
    echo "✓ Detected Linux userland environment: $(uname -s) ($(uname -m))"
fi

# 2. Install Prerequisites (Node.js, Git, Python, Curl)
echo "⠋ Updating package lists and installing essential runtimes..."
if [ "$IS_TERMUX" = true ]; then
    pkg update -y
    pkg install -y git nodejs curl python tar
else
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update -y || apt-get update -y
        sudo apt-get install -y git nodejs npm curl python3 tar || apt-get install -y git nodejs npm curl python3 tar
    elif command -v apk >/dev/null 2>&1; then
        apk update && apk add git nodejs curl python3 tar bash
    fi
fi
echo "✓ Node.js $(node -v) & Git installed."

# 3. Install Official Google Antigravity CLI ('agy')
echo ""
echo "⠋ Installing official Google Antigravity CLI for $(uname -m)..."
export PATH="$HOME/.local/bin:$PATH"

if command -v agy >/dev/null 2>&1; then
    echo "✓ Antigravity CLI ('agy') is already installed at $(command -v agy)"
else
    curl -fsSL https://antigravity.google/cli/install.sh | bash || {
        echo "⚠️  Note: If the standard installer requires adjustments, verifying local bin..."
    }
fi

# Ensure ~/.local/bin is in PATH in shell config
SHELL_RC="$HOME/.bashrc"
if [ -f "$HOME/.zshrc" ]; then
    SHELL_RC="$HOME/.zshrc"
fi

if ! grep -q '\.local/bin' "$SHELL_RC" 2>/dev/null; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_RC"
fi

# 4. Clone or Update IDE Repository
INSTALL_DIR="$HOME/antigravity-ide"
echo ""
echo "⠋ Setting up Antigravity Mobile Web IDE in $INSTALL_DIR..."

if [ -d "$INSTALL_DIR/.git" ]; then
    echo "Updating existing installation..."
    cd "$INSTALL_DIR"
    git pull origin main || true
else
    rm -rf "$INSTALL_DIR"
    git clone https://github.com/sv007git/IDE.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Create default starter workspace if not present
mkdir -p "$INSTALL_DIR/workspace"
if [ ! -f "$INSTALL_DIR/workspace/index.html" ]; then
    cat << 'EOF' > "$INSTALL_DIR/workspace/index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phone App</title>
</head>
<body style="background: #0f172a; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh;">
  <h1>⚡ Powered by Android Hardware</h1>
  <p>Running natively on your phone's Linux subsystem.</p>
</body>
</html>
EOF
fi

# 5. Create Global Launcher Command: 'antigravity-ide'
LAUNCHER_PATH="/data/data/com.termux/files/usr/bin/antigravity-ide"
if [ ! -d "/data/data/com.termux/files/usr/bin" ]; then
    LAUNCHER_PATH="$HOME/.local/bin/antigravity-ide"
fi

mkdir -p "$(dirname "$LAUNCHER_PATH")"
cat << EOF > "$LAUNCHER_PATH"
#!/bin/bash
export PATH="\$HOME/.local/bin:\$PATH"
cd "$INSTALL_DIR"
echo "Starting Antigravity Native Android IDE..."
node server.js
EOF
chmod +x "$LAUNCHER_PATH"

echo ""
echo "===================================================================="
echo "🎉 Setup Complete! Your Android Phone is now an AI Workstation!"
echo "===================================================================="
echo ""
echo "To start the IDE anytime in your terminal, just run:"
echo "    antigravity-ide"
echo ""
echo "You can also launch Antigravity CLI directly in this terminal:"
echo "    agy"
echo ""
echo "Starting Antigravity Native Server now..."
echo "--------------------------------------------------------------------"
cd "$INSTALL_DIR"
node server.js
