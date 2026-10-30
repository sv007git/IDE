// Antigravity Native Android Backend Server
// Zero-dependency Node.js server that runs natively on Android (Termux / Linux)
// Gives the web IDE full access to phone resources, Linux shell, and Antigravity CLI ('agy')

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT_DIR = __dirname;
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || path.join(ROOT_DIR, 'workspace');

// Ensure workspace directory exists
if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

// Find agy binary path
function getAgyPath() {
  const home = os.homedir();
  const candidates = [
    path.join(home, '.local', 'bin', 'agy'),
    path.join(home, 'bin', 'agy'),
    '/data/data/com.termux/files/usr/bin/agy',
    '/usr/local/bin/agy',
    '/usr/bin/agy'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  try {
    const whichCmd = os.platform() === 'win32' ? 'where agy' : 'which agy';
    const res = execSync(whichCmd, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim().split('\n')[0];
    if (res && fs.existsSync(res)) return res;
  } catch (e) {}
  return null;
}

// Get system & phone hardware stats
function getSystemInfo() {
  const agyPath = getAgyPath();
  let agyVersion = 'Not installed';
  if (agyPath) {
    try {
      agyVersion = execSync(`"${agyPath}" --version`, { timeout: 3000 }).toString().trim();
    } catch (e) {
      agyVersion = 'Installed (Ready)';
    }
  }

  const isAndroid = process.platform === 'android' || fs.existsSync('/data/data/com.termux');
  const cpus = os.cpus();
  const totalMem = Math.round(os.totalmem() / (1024 * 1024));
  const freeMem = Math.round(os.freemem() / (1024 * 1024));

  return {
    platform: process.platform,
    isAndroid,
    arch: os.arch(),
    hostname: os.hostname(),
    cpuCount: cpus ? cpus.length : 1,
    cpuModel: cpus && cpus[0] ? cpus[0].model : 'ARM Processor',
    totalMemMB: totalMem,
    freeMemMB: freeMem,
    agyInstalled: !!agyPath,
    agyPath: agyPath || 'none',
    agyVersion,
    workspaceDir: WORKSPACE_DIR,
    nodeVersion: process.version
  };
}

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 50 * 1024 * 1024) { // 50MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response
function sendJson(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Request dispatcher
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // API ROUTING
  if (pathname.startsWith('/api/')) {
    try {
      // 1. Health & Status
      if (pathname === '/api/status' && req.method === 'GET') {
        return sendJson(res, { success: true, ...getSystemInfo() });
      }

      // 2. List Files in Workspace
      if (pathname === '/api/files' && req.method === 'GET') {
        const files = [];
        const entries = fs.readdirSync(WORKSPACE_DIR, { withFileTypes: true });
        for (const entry of entries) {
          const filePath = path.join(WORKSPACE_DIR, entry.name);
          const stat = fs.statSync(filePath);
          files.push({
            name: entry.name,
            isDirectory: entry.isDirectory(),
            size: stat.size,
            mtime: stat.mtime
          });
        }
        return sendJson(res, { success: true, workspaceDir: WORKSPACE_DIR, files });
      }

      // 3. Read File
      if (pathname === '/api/file/read' && req.method === 'GET') {
        const fileName = url.searchParams.get('name');
        if (!fileName) return sendJson(res, { error: 'Filename required' }, 400);
        
        // Security check: stay inside workspace
        const targetPath = path.resolve(WORKSPACE_DIR, fileName);
        if (!targetPath.startsWith(WORKSPACE_DIR)) {
          return sendJson(res, { error: 'Access denied outside workspace' }, 403);
        }

        if (!fs.existsSync(targetPath)) {
          return sendJson(res, { error: 'File not found' }, 404);
        }

        const content = fs.readFileSync(targetPath, 'utf8');
        return sendJson(res, { success: true, name: fileName, content });
      }

      // 4. Write / Save File
      if (pathname === '/api/file/write' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const { name, content } = body;
        if (!name) return sendJson(res, { error: 'Filename required' }, 400);

        const targetPath = path.resolve(WORKSPACE_DIR, name);
        if (!targetPath.startsWith(WORKSPACE_DIR)) {
          return sendJson(res, { error: 'Access denied' }, 403);
        }

        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, content || '', 'utf8');
        return sendJson(res, { success: true, name });
      }

      // 5. Delete File
      if (pathname === '/api/file/delete' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const { name } = body;
        if (!name) return sendJson(res, { error: 'Filename required' }, 400);

        const targetPath = path.resolve(WORKSPACE_DIR, name);
        if (!targetPath.startsWith(WORKSPACE_DIR)) {
          return sendJson(res, { error: 'Access denied' }, 403);
        }

        if (fs.existsSync(targetPath)) {
          fs.unlinkSync(targetPath);
          return sendJson(res, { success: true, deleted: name });
        }
        return sendJson(res, { error: 'File not found' }, 404);
      }

      // 6. Rename File
      if (pathname === '/api/file/rename' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const { oldName, newName } = body;
        if (!oldName || !newName) return sendJson(res, { error: 'Both old and new names required' }, 400);

        const oldPath = path.resolve(WORKSPACE_DIR, oldName);
        const newPath = path.resolve(WORKSPACE_DIR, newName);

        if (!oldPath.startsWith(WORKSPACE_DIR) || !newPath.startsWith(WORKSPACE_DIR)) {
          return sendJson(res, { error: 'Access denied' }, 403);
        }

        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          return sendJson(res, { success: true, oldName, newName });
        }
        return sendJson(res, { error: 'File not found' }, 404);
      }

      // 7. Execute Native Terminal Shell Command on Phone
      if (pathname === '/api/exec' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const cmd = body.command;
        if (!cmd) return sendJson(res, { error: 'Command required' }, 400);

        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Access-Control-Allow-Origin': '*'
        });

        const shell = process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL || '/bin/sh');
        const shellArg = process.platform === 'win32' ? '-Command' : '-c';

        // Prepend PATH with ~/.local/bin where agy lives
        const env = Object.assign({}, process.env, {
          PATH: `${path.join(os.homedir(), '.local', 'bin')}:${process.env.PATH || ''}`
        });

        const proc = spawn(shell, [shellArg, cmd], {
          cwd: WORKSPACE_DIR,
          env
        });

        proc.stdout.on('data', data => res.write(data));
        proc.stderr.on('data', data => res.write(data));

        proc.on('close', code => {
          res.write(`\n[Process exited with code ${code}]\n`);
          res.end();
        });

        proc.on('error', err => {
          res.write(`\n[Execution Error: ${err.message}]\n`);
          res.end();
        });

        return;
      }

      // 8. Run Antigravity CLI Agent ('agy')
      if (pathname === '/api/agent' && req.method === 'POST') {
        const body = await parseJsonBody(req);
        const prompt = body.prompt;
        if (!prompt) return sendJson(res, { error: 'Prompt required' }, 400);

        const agyPath = getAgyPath();
        if (!agyPath) {
          return sendJson(res, {
            error: "Antigravity CLI ('agy') is not found on this phone.",
            hint: "Run 'curl -fsSL https://antigravity.google/cli/install.sh | bash' in Termux to install it."
          }, 404);
        }

        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Access-Control-Allow-Origin': '*'
        });

        res.write(`⚡ Invoking Antigravity CLI Engine on phone...\n`);
        res.write(`[Device: ${os.hostname()} | Arch: ${os.arch()} | Workspace: ${WORKSPACE_DIR}]\n\n`);

        const env = Object.assign({}, process.env, {
          PATH: `${path.join(os.homedir(), '.local', 'bin')}:${process.env.PATH || ''}`
        });

        // Run agy in headless print mode (-p / --print)
        const proc = spawn(agyPath, ['-p', prompt], {
          cwd: WORKSPACE_DIR,
          env
        });

        proc.stdout.on('data', data => res.write(data));
        proc.stderr.on('data', data => res.write(data));

        proc.on('close', code => {
          res.write(`\n\n✓ Antigravity turn completed with code ${code}.\n`);
          res.end();
        });

        proc.on('error', err => {
          res.write(`\n\n❌ Agent Error: ${err.message}\n`);
          res.end();
        });

        return;
      }

      // Unknown API route
      return sendJson(res, { error: 'Endpoint not found' }, 404);
    } catch (err) {
      console.error('API Error:', err);
      return sendJson(res, { error: err.message }, 500);
    }
  }

  // STATIC FILE SERVING
  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '') safePath = '/index.html';

  const filePath = path.join(ROOT_DIR, safePath);
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    return res.end('Access Denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 Fallback to index.html for SPA routing
      const indexPath = path.join(ROOT_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404);
          return res.end('Not Found');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  const info = getSystemInfo();
  console.log(`\n======================================================`);
  console.log(`🚀 Antigravity Native Android Server Active!`);
  console.log(`======================================================`);
  console.log(`📱 Local URL:      http://localhost:${PORT}`);
  console.log(`🌐 Network URL:    http://${getNetworkIp()}:${PORT}`);
  console.log(`📂 Workspace:      ${WORKSPACE_DIR}`);
  console.log(`⚙️  Platform:       ${info.platform} (${info.arch}) - ${info.cpuCount} Cores`);
  console.log(`🧠 Memory:         ${info.freeMemMB}MB free / ${info.totalMemMB}MB total`);
  console.log(`⚡ Antigravity:    ${info.agyPath}`);
  console.log(`======================================================\n`);
  console.log(`Open http://localhost:${PORT} in your Android mobile browser!`);
});

function getNetworkIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}
