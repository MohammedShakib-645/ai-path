const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("aiPath", {
  onStatus: (fn) => ipcRenderer.on("setup-status", (_e, v) => fn(v)),
  quit: () => ipcRenderer.send("quit"),
});
