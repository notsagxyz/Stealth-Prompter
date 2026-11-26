import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { DIST_DIR } from './paths.js';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
};

export function findBrowserExecutable() {
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

export function startDistServer(distDir = DIST_DIR) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(distDir)) {
      reject(new Error(`Built dist directory does not exist at: ${distDir}. Run 'pnpm build' first.`));
      return;
    }

    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
      let rel = decodeURIComponent(reqUrl.pathname).replace(/^\/+/, '');
      if (!rel) rel = 'index.html';

      const targetPath = path.resolve(distDir, rel);
      if (!targetPath.startsWith(path.resolve(distDir))) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const ext = path.extname(targetPath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      fs.createReadStream(targetPath).pipe(res);
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({
        server,
        port: addr.port,
        baseUrl: `http://127.0.0.1:${addr.port}`,
        close: () => new Promise((resClose) => server.close(() => resClose())),
      });
    });
  });
}

/**
 * Clean RFC 6455 WebSocket client over loopback node:net for Node 20.
 * Handles masked client frames, multi-byte server payload lengths (126/65535), and fragmented frames.
 */
class Rfc6455Client {
  constructor(wsUrl) {
    this.url = new URL(wsUrl);
    this.socket = null;
    this.buffer = Buffer.alloc(0);
    this.upgraded = false;
    this.fragments = [];
    this.fragmentOpcode = null;
    this.onMessage = null;
    this.onClose = null;
  }

  connect(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const port = Number(this.url.port) || 80;
      const host = this.url.hostname;
      const pathWithQuery = `${this.url.pathname}${this.url.search}`;
      const key = crypto.randomBytes(16).toString('base64');

      const timer = setTimeout(() => {
        if (this.socket) this.socket.destroy();
        reject(new Error(`WebSocket handshake timed out connecting to ${this.url.href}`));
      }, timeoutMs);

      this.socket = net.createConnection({ host, port }, () => {
        const req = [
          `GET ${pathWithQuery} HTTP/1.1`,
          `Host: ${host}:${port}`,
          'Upgrade: websocket',
          'Connection: Upgrade',
          `Sec-WebSocket-Key: ${key}`,
          'Sec-WebSocket-Version: 13',
          '\r\n',
        ].join('\r\n');
        this.socket.write(req);
      });

      this.socket.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      this.socket.on('close', () => {
        if (this.onClose) this.onClose();
      });

      this.socket.on('data', (chunk) => {
        this.buffer = Buffer.concat([this.buffer, chunk]);
        if (!this.upgraded) {
          const headerEnd = this.buffer.indexOf('\r\n\r\n');
          if (headerEnd === -1) return;
          const headers = this.buffer.subarray(0, headerEnd).toString('utf8');
          if (!headers.startsWith('HTTP/1.1 101')) {
            clearTimeout(timer);
            reject(new Error(`WebSocket upgrade failed: ${headers.split('\r\n')[0]}`));
            return;
          }
          this.upgraded = true;
          this.buffer = this.buffer.subarray(headerEnd + 4);
          clearTimeout(timer);
          resolve();
        }
        this._drainFrames();
      });
    });
  }

  _drainFrames() {
    while (this.buffer.length >= 2) {
      const byte1 = this.buffer[0];
      const byte2 = this.buffer[1];
      const fin = (byte1 & 0x80) !== 0;
      const opcode = byte1 & 0x0f;
      const masked = (byte2 & 0x80) !== 0;
      let payloadLen = byte2 & 0x7f;
      let offset = 2;

      if (payloadLen === 126) {
        if (this.buffer.length < 4) return;
        payloadLen = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (payloadLen === 127) {
        if (this.buffer.length < 10) return;
        const high = this.buffer.readUInt32BE(2);
        const low = this.buffer.readUInt32BE(6);
        payloadLen = high * 0x100000000 + low;
        offset = 10;
      }

      const maskLen = masked ? 4 : 0;
      if (this.buffer.length < offset + maskLen + payloadLen) return;

      let payload = this.buffer.subarray(offset + maskLen, offset + maskLen + payloadLen);
      if (masked) {
        const maskKey = this.buffer.subarray(offset, offset + 4);
        const unmasked = Buffer.alloc(payloadLen);
        for (let i = 0; i < payloadLen; i++) {
          unmasked[i] = payload[i] ^ maskKey[i % 4];
        }
        payload = unmasked;
      }

      this.buffer = this.buffer.subarray(offset + maskLen + payloadLen);

      if (opcode === 0x8) {
        // Close
        this.close();
        return;
      } else if (opcode === 0x9) {
        // Ping -> Pong
        this._sendFrame(0x0a, payload);
        continue;
      } else if (opcode === 0x0a) {
        continue;
      }

      if (opcode !== 0x0) {
        this.fragmentOpcode = opcode;
        this.fragments = [payload];
      } else {
        this.fragments.push(payload);
      }

      if (fin) {
        const full = Buffer.concat(this.fragments);
        const finalOpcode = this.fragmentOpcode;
        this.fragments = [];
        this.fragmentOpcode = null;
        if (finalOpcode === 0x1 && this.onMessage) {
          this.onMessage(full.toString('utf8'));
        }
      }
    }
  }

  _sendFrame(opcode, dataBuffer) {
    if (!this.socket || this.socket.destroyed) return;
    const len = dataBuffer.length;
    const maskKey = crypto.randomBytes(4);
    let header;

    if (len < 126) {
      header = Buffer.alloc(2);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | len;
    } else if (len < 65536) {
      header = Buffer.alloc(4);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x80 | opcode;
      header[1] = 0x80 | 127;
      header.writeUInt32BE(Math.floor(len / 0x100000000), 2);
      header.writeUInt32BE(len >>> 0, 6);
    }

    const maskedPayload = Buffer.alloc(len);
    for (let i = 0; i < len; i++) {
      maskedPayload[i] = dataBuffer[i] ^ maskKey[i % 4];
    }

    this.socket.write(Buffer.concat([header, maskKey, maskedPayload]));
  }

  sendText(text) {
    this._sendFrame(0x1, Buffer.from(text, 'utf8'));
  }

  close() {
    if (this.socket && !this.socket.destroyed) {
      try {
        this._sendFrame(0x8, Buffer.alloc(0));
      } catch {
        // ignore
      }
      this.socket.destroy();
    }
  }
}

class CdpSession {
  constructor(wsClient) {
    this.ws = wsClient;
    this.nextId = 1;
    this.pending = new Map();
    this.eventListeners = new Map();

    this.ws.onMessage = (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }
      if (typeof msg.id === 'number') {
        const entry = this.pending.get(msg.id);
        if (entry) {
          this.pending.delete(msg.id);
          clearTimeout(entry.timer);
          if (msg.error) {
            entry.reject(new Error(`CDP error (${entry.method}): ${msg.error.message}`));
          } else {
            entry.resolve(msg.result || {});
          }
        }
      } else if (msg.method) {
        const listeners = this.eventListeners.get(msg.method);
        if (listeners) {
          for (const cb of listeners) cb(msg.params || {});
        }
      }
    };
  }

  send(method, params = {}, timeoutMs = 15000) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP command timed out: ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer, method });
      this.ws.sendText(JSON.stringify({ id, method, params }));
    });
  }

  on(method, cb) {
    if (!this.eventListeners.has(method)) {
      this.eventListeners.set(method, new Set());
    }
    this.eventListeners.get(method).add(cb);
    return () => this.eventListeners.get(method)?.delete(cb);
  }

  close() {
    for (const [, entry] of this.pending) {
      clearTimeout(entry.timer);
      entry.reject(new Error('CDP session closed'));
    }
    this.pending.clear();
    this.ws.close();
  }
}

export function buildTauriMockInitScript(seed = {}) {
  const serializedSeed = JSON.stringify({
    settings: seed.settings || null,
    scripts: seed.scripts || [],
    captureExclusion: seed.captureExclusion ?? true,
    windowLabel: seed.windowLabel || 'launcher',
  });

  return `
(() => {
  const seed = ${serializedSeed};
  const listeners = new Map();
  let nextCbId = 1;
  const callbacks = new Map();
  const invoked = [];

  const defaultSettings = Object.assign({
    scroll_speed: 2.5,
    font_size: 44,
    line_height: 1.5,
    window_opacity: 0.75,
    mirror_mode: false,
    click_through: false,
    capture_exclusion: true,
    accent_color: 'violet',
    theme: 'dark-glass',
    last_script_id: seed.scripts[0] ? seed.scripts[0].id : null,
    offline_only: true,
    telemetry_enabled: false,
    geometry: { x: 100, y: 100, width: 1000, height: 350 },
    hotkeys: {
      toggle_play: 'Alt+Space',
      speed_up: 'Alt+Up',
      speed_down: 'Alt+Down',
      toggle_visibility: 'Alt+H',
      toggle_window: 'Alt+H',
      rewind: 'Alt+R',
      toggle_click_through: 'Alt+L',
      scroll_up: 'Alt+Shift+Up',
      scroll_down: 'Alt+Shift+Down',
      opacity_up: 'Alt+Shift+Right',
      opacity_down: 'Alt+Shift+Left',
    },
  }, seed.settings || {});

  const scriptsMap = new Map();
  for (const s of seed.scripts) {
    scriptsMap.set(s.id, Object.assign({
      id: s.id,
      title: s.title || 'Untitled',
      content: s.content || '',
      last_position: s.last_position || 0,
      speed: s.speed || defaultSettings.scroll_speed,
      created_at: s.created_at || new Date().toISOString(),
      updated_at: s.updated_at || new Date().toISOString(),
      cues: s.cues || [],
    }, s));
  }

  let currentSettings = JSON.parse(JSON.stringify(defaultSettings));
  let captureExclusion = seed.captureExclusion;

  function makeSummary(s) {
    const clean = (s.content || '').trim();
    const words = clean ? clean.split(/\\s+/).length : 0;
    return {
      id: s.id,
      title: s.title,
      created_at: s.created_at,
      updated_at: s.updated_at,
      last_position: s.last_position || 0,
      speed: s.speed || currentSettings.scroll_speed,
      word_count: words,
      estimated_duration_sec: Math.round((words / 130) * 60),
      snippet: clean.slice(0, 120),
    };
  }

  function dispatchEvent(eventName, payload) {
    const set = listeners.get(eventName);
    if (!set) return;
    for (const cbId of set) {
      const fn = callbacks.get(cbId);
      if (fn) {
        try {
          fn({ event: eventName, id: cbId, payload });
        } catch (err) {
          console.error('Mock listener error:', err);
        }
      }
    }
  }

  window.__STEALTH_TEST_HARNESS__ = {
    invoked,
    getSettings: () => currentSettings,
    emitEvent: (eventName, payload) => dispatchEvent(eventName, payload),
    getScripts: () => Array.from(scriptsMap.values()),
  };

  window.__TAURI_INTERNALS__ = {
    metadata: {
      currentWindow: { label: seed.windowLabel },
      currentWebview: { label: seed.windowLabel, windowLabel: seed.windowLabel },
    },
    transformCallback(callback, once = false) {
      const id = nextCbId++;
      callbacks.set(id, (...args) => {
        if (once) callbacks.delete(id);
        return callback(...args);
      });
      return id;
    },
    unregisterCallback(id) {
      callbacks.delete(id);
    },
    convertFileSrc(filePath) {
      return filePath;
    },
    async invoke(cmd, args = {}) {
      invoked.push({ cmd, args: JSON.parse(JSON.stringify(args || {})) });

      if (cmd === 'plugin:event|listen') {
        const ev = args.event;
        const handlerId = args.handler;
        if (!listeners.has(ev)) listeners.set(ev, new Set());
        listeners.get(ev).add(handlerId);
        return handlerId;
      }
      if (cmd === 'plugin:event|unlisten') {
        const ev = args.event;
        const eventId = args.eventId;
        listeners.get(ev)?.delete(eventId);
        return null;
      }
      if (cmd === 'plugin:event|emit' || cmd === 'plugin:event|emit_to') {
        dispatchEvent(args.event, args.payload);
        return null;
      }
      if (cmd === 'plugin:window|start_dragging' || cmd === 'plugin:window|start_resize_dragging' ||
          cmd === 'plugin:window|minimize' || cmd === 'plugin:window|toggle_maximize' || cmd === 'plugin:window|close') {
        return null;
      }
      if (cmd === 'load_settings') {
        return JSON.parse(JSON.stringify(currentSettings));
      }
      if (cmd === 'save_settings') {
        if (args.settings) {
          currentSettings = Object.assign({}, currentSettings, args.settings);
          dispatchEvent('prompter:settings_sync', currentSettings);
        }
        return null;
      }
      if (cmd === 'list_scripts') {
        return Array.from(scriptsMap.values()).map(makeSummary);
      }
      if (cmd === 'load_script') {
        if (scriptsMap.has(args.id)) return JSON.parse(JSON.stringify(scriptsMap.get(args.id)));
        const first = Array.from(scriptsMap.values())[0];
        if (first) return JSON.parse(JSON.stringify(first));
        throw new Error('Script not found: ' + args.id);
      }
      if (cmd === 'save_script') {
        if (args.script) {
          scriptsMap.set(args.script.id, JSON.parse(JSON.stringify(args.script)));
        }
        return null;
      }
      if (cmd === 'delete_script') {
        return scriptsMap.delete(args.id);
      }
      if (cmd === 'set_click_through') {
        currentSettings.click_through = Boolean(args.enabled);
        dispatchEvent('prompter:settings_sync', currentSettings);
        return null;
      }
      if (cmd === 'set_capture_exclusion') {
        captureExclusion = Boolean(args.enabled);
        return null;
      }
      if (cmd === 'get_capture_exclusion') {
        return captureExclusion;
      }
      if (cmd === 'toggle_prompter_window') {
        return null;
      }
      return null;
    },
  };
})();
`;
}

export async function launchCdpSession(options = {}) {
  const {
    distDir = DIST_DIR,
    width = 1280,
    height = 800,
    reducedMotion = false,
  } = options;

  const browserExe = findBrowserExecutable();
  if (!browserExe) {
    throw new Error('No Chromium-based browser (msedge.exe or chrome.exe) found on host.');
  }

  const httpServer = await startDistServer(distDir);
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stealth-cdp-profile-'));

  let browserProc = null;
  let cdp = null;

  try {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-extensions',
      `--window-size=${width},${height}`,
      `--user-data-dir=${profileDir}`,
      '--remote-debugging-port=0',
      'about:blank',
    ];

    browserProc = spawn(browserExe, args, { windowsHide: true });

    const wsEndpoint = await new Promise((resolve, reject) => {
      let stderrBuf = '';
      const timer = setTimeout(() => {
        reject(new Error(`Timed out waiting for DevTools WebSocket URL from ${browserExe}. stderr: ${stderrBuf}`));
      }, 15000);

      browserProc.stderr.on('data', (chunk) => {
        stderrBuf += chunk.toString('utf8');
        const match = stderrBuf.match(/DevTools listening on (ws:\/\/[^\s]+)/);
        if (match) {
          clearTimeout(timer);
          resolve(match[1]);
        }
      });

      browserProc.on('exit', (code) => {
        clearTimeout(timer);
        reject(new Error(`Browser exited prematurely with code ${code}. stderr: ${stderrBuf}`));
      });
    });

    // Get page target WebSocket URL from /json/list
    const parsedWs = new URL(wsEndpoint);
    const targetsRes = await fetch(`http://${parsedWs.host}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error(`No inspectable page target returned by DevTools at http://${parsedWs.host}/json/list`);
    }

    const wsClient = new Rfc6455Client(pageTarget.webSocketDebuggerUrl);
    await wsClient.connect();
    cdp = new CdpSession(wsClient);

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });

    if (reducedMotion) {
      await cdp.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      });
    }

    const networkRequests = [];
    const failedRequests = [];
    const consoleErrors = [];

    cdp.on('Network.requestWillBeSent', (params) => {
      networkRequests.push({
        url: params.request?.url || '',
        type: params.type || '',
      });
    });

    cdp.on('Network.loadingFailed', (params) => {
      failedRequests.push({
        requestId: params.requestId,
        errorText: params.errorText,
      });
    });

    cdp.on('Runtime.exceptionThrown', (params) => {
      consoleErrors.push(params.exceptionDetails?.text || 'Runtime exception');
    });

    cdp.on('Runtime.consoleAPICalled', (params) => {
      if (params.type === 'error') {
        const msg = (params.args || []).map((a) => a.value || a.description || '').join(' ');
        consoleErrors.push(msg);
      }
    });

    async function openPage(relPath, pageOptions = {}) {
      networkRequests.length = 0;
      failedRequests.length = 0;
      consoleErrors.length = 0;

      if (pageOptions.width && pageOptions.height) {
        await cdp.send('Emulation.setDeviceMetricsOverride', {
          width: pageOptions.width,
          height: pageOptions.height,
          deviceScaleFactor: 1,
          mobile: false,
        });
      }

      if (pageOptions.tauriMock !== false) {
        const mockScript = buildTauriMockInitScript(
          typeof pageOptions.tauriMock === 'object' ? pageOptions.tauriMock : {}
        );
        await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: mockScript });
      }

      const loadPromise = new Promise((resolve) => {
        const unsub = cdp.on('Page.loadEventFired', () => {
          unsub();
          resolve();
        });
        setTimeout(() => {
          unsub();
          resolve();
        }, 8000);
      });

      const cleanRel = relPath.replace(/^\/+/, '');
      await cdp.send('Page.navigate', { url: `${httpServer.baseUrl}/${cleanRel}` });
      await loadPromise;
      // Wait for SolidJS mount + fonts
      await new Promise((r) => setTimeout(r, pageOptions.waitMs ?? 350));
    }

    async function evaluate(fnOrExpr, ...args) {
      const expression =
        typeof fnOrExpr === 'function'
          ? `(${fnOrExpr.toString()})(...${JSON.stringify(args)})`
          : fnOrExpr;
      const res = await cdp.send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      if (res.exceptionDetails) {
        throw new Error(
          `Browser evaluation failed: ${res.exceptionDetails.exception?.description || res.exceptionDetails.text}`
        );
      }
      return res.result?.value;
    }

    async function dispatchWheel(x, y, deltaX, deltaY) {
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseWheel',
        x,
        y,
        deltaX,
        deltaY,
      });
    }

    async function moveMouse(x, y) {
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x,
        y,
      });
    }

    async function drag(startX, startY, endX, endY, steps = 8) {
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: startX,
        y: startY,
        button: 'left',
        clickCount: 1,
      });
      for (let i = 1; i <= steps; i++) {
        const nx = startX + ((endX - startX) * i) / steps;
        const ny = startY + ((endY - startY) * i) / steps;
        await cdp.send('Input.dispatchMouseEvent', {
          type: 'mouseMoved',
          x: nx,
          y: ny,
          button: 'left',
        });
      }
      await cdp.send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: endX,
        y: endY,
        button: 'left',
        clickCount: 1,
      });
    }

    async function pressKey(key, code, keyCode, modifiers = 0) {
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key,
        code: code || key,
        windowsVirtualKeyCode: keyCode || 0,
        modifiers,
      });
      await cdp.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key,
        code: code || key,
        windowsVirtualKeyCode: keyCode || 0,
        modifiers,
      });
    }

    async function setReducedMotion(enabled) {
      await cdp.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: enabled ? 'reduce' : 'no-preference' }],
      });
    }

    async function setOffline(offline) {
      await cdp.send('Network.emulateNetworkConditions', {
        offline,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      });
    }

    async function setViewport(w, h) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: h,
        deviceScaleFactor: 1,
        mobile: false,
      });
    }

    async function close() {
      try {
        if (cdp) cdp.close();
      } catch {
        // ignore
      }
      if (browserProc && !browserProc.killed) {
        try {
          if (process.platform === 'win32' && browserProc.pid) {
            await new Promise((res) => {
              const tk = spawn('taskkill', ['/PID', String(browserProc.pid), '/T', '/F'], {
                windowsHide: true,
              });
              tk.on('close', res);
              tk.on('error', res);
            });
          } else {
            browserProc.kill('SIGKILL');
          }
        } catch {
          // ignore
        }
      }
      await httpServer.close();
      try {
        fs.rmSync(profileDir, { recursive: true, force: true });
      } catch {
        // best effort
      }
    }

    async function screenshot(filePath) {
      const res = await cdp.send('Page.captureScreenshot', { format: 'png' });
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    }

    return {
      baseUrl: httpServer.baseUrl,
      openPage,
      evaluate,
      screenshot,
      dispatchWheel,
      moveMouse,
      drag,
      pressKey,
      setReducedMotion,
      setOffline,
      setViewport,
      getNetworkRequests: () => [...networkRequests],
      getFailedRequests: () => [...failedRequests],
      getConsoleErrors: () => [...consoleErrors],
      close,
    };
  } catch (err) {
    if (cdp) try { cdp.close(); } catch {}
    if (browserProc && browserProc.pid) {
      try {
        spawn('taskkill', ['/PID', String(browserProc.pid), '/T', '/F'], { windowsHide: true });
      } catch {}
    }
    await httpServer.close();
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
    throw err;
  }
}
