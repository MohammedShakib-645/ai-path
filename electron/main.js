/**
 * AI-Path desktop shell (Electron).
 * Double-click experience on any Windows laptop:
 *   1. starts bundled (or system) Ollama server
 *   2. downloads the default model on first run (with progress)
 *   3. starts the Next.js standalone server
 *   4. opens the app window — no browser, no terminal, no setup
 */
const { app, BrowserWindow, ipcMain } = require("electron");
const { spawn, execFile } = require("child_process");
const path = require("path");
const fs = require("fs");

const PORT = process.env.AI_PATH_PORT || "3000";
const APP_URL = `http://127.0.0.1:${PORT}`;
const OLLAMA_HOST = process.env.OLLAMA_HOST || "127.0.0.1:11434";
const OLLAMA_API = `http://${OLLAMA_HOST}`;
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "qwen3:8b";

const isPackaged = app.isPackaged;
const children = new Set();

function ollamaBin() {
  // 1) bundled sidecar (inside the installed .exe resources)
  const bundled = path.join(process.resourcesPath || "", "ollama-bin", "ollama.exe");
  if (isPackaged && fs.existsSync(bundled)) return bundled;
  // 2) dev machine layout
  const devBin = "D:\\ollama\\bin\\ollama.exe";
  if (fs.existsSync(devBin)) return devBin;
  // 3) hope it's on PATH
  return "ollama";
}

function modelsDir() {
  if (process.env.OLLAMA_MODELS) return process.env.OLLAMA_MODELS;
  if (isPackaged) return path.join(app.getPath("userData"), "models");
  return "D:\\ollama\\models";
}

function report(win, step, detail) {
  try { win.webContents.send("setup-status", { step, detail }); } catch { /* splash closed */ }
}

async function waitFor(url, timeoutMs, label) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`${label} did not start in time (${url})`);
}

function runOllama(args, envExtra = {}) {
  const bin = ollamaBin();
  const env = { ...process.env, OLLAMA_MODELS: modelsDir(), OLLAMA_HOST, ...envExtra };
  const child = spawn(bin, args, { env, windowsHide: true });
  children.add(child);
  child.on("exit", () => children.delete(child));
  return child;
}

async function ensureOllama(win) {
  report(win, "ollama", "Checking local AI engine…");
  try {
    const res = await fetch(`${OLLAMA_API}/api/tags`, { cache: "no-store" });
    if (res.ok) {
      report(win, "ollama", "AI engine already running ✓");
      return await res.json();
    }
  } catch { /* start our own */ }
  report(win, "ollama", "Starting built-in AI engine…");
  runOllama(["serve"]);
  await waitFor(`${OLLAMA_API}/api/tags`, 60000, "Ollama");
  report(win, "ollama", "AI engine running ✓");
}

async function ensureModel(win, tags) {
  const names = (tags.models || []).map((m) => m.name);
  if (names.some((n) => n === DEFAULT_MODEL || n.startsWith(DEFAULT_MODEL.split(":")[0] + ":"))) {
    report(win, "model", `${DEFAULT_MODEL} ready ✓`);
    return;
  }
  report(win, "model", `First run: downloading ${DEFAULT_MODEL} (~5GB, one time)…`);
  await new Promise((resolve, reject) => {
    const child = runOllama(["pull", DEFAULT_MODEL]);
    let out = "";
    const onData = (d) => {
      out += d.toString();
      const m = out.match(/(\d+)%/g);
      if (m) report(win, "model", `Downloading ${DEFAULT_MODEL}… ${m[m.length - 1]}`);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`model download failed (exit ${code})`))));
    child.on("error", reject);
  });
  report(win, "model", `${DEFAULT_MODEL} ready ✓`);
}

async function ensureWeb(win) {
  if (!isPackaged) {
    report(win, "app", "Waiting for dev server (npm run dev)…");
    await waitFor(APP_URL, 60000, "Next.js dev server");
    report(win, "app", "App ready ✓");
    return;
  }
  report(win, "app", "Starting AI-Path…");
  try {
    await fetch(APP_URL, { cache: "no-store" });
    report(win, "app", "App ready ✓");
    return;
  } catch { /* start standalone server */ }
  const serverJs = path.join(process.resourcesPath, "app", ".next", "standalone", "server.js");
  const child = spawn(process.execPath, [serverJs], {
    env: { ...process.env, PORT, HOSTNAME: "127.0.0.1" },
    windowsHide: true,
  });
  children.add(child);
  child.on("exit", () => children.delete(child));
  await waitFor(APP_URL, 60000, "AI-Path server");
  report(win, "app", "App ready ✓");
}

function createSplash() {
  const win = new BrowserWindow({
    width: 420, height: 360, resizable: false, center: true,
    autoHideMenuBar: true, title: "AI-Path",
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });
  win.loadFile(path.join(__dirname, "splash.html"));
  return win;
}

function createMain() {
  const win = new BrowserWindow({
    width: 1400, height: 900, autoHideMenuBar: true,
    title: "AI-Path — Your Personal AI Tutor",
    backgroundColor: "#f4f6fb",
  });
  win.loadURL(APP_URL);
  return win;
}

app.whenReady().then(async () => {
  const splash = createSplash();
  try {
    const tags = await ensureOllama(splash).catch(async () => {
      // ensureOllama returns tags on fast path; on slow path fetch again
      const res = await fetch(`${OLLAMA_API}/api/tags`);
      return await res.json();
    });
    await ensureModel(splash, tags);
    await ensureWeb(splash);
    createMain();
    splash.close();
  } catch (err) {
    report(splash, "error", String(err.message || err));
  }
});

app.on("window-all-closed", () => {
  children.forEach((c) => { try { c.kill(); } catch { /* gone */ } });
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("quit", () => app.quit());
