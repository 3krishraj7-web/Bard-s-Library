const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

// Ensure Windows taskbar binds and displays the custom application icon
if (process.platform === "win32") {
  app.setAppUserModelId("com.bardslibrary.app");
}

function createWindow() {
  const icoPath = path.join(__dirname, "../build/icon.ico");
  const pngPath = path.join(__dirname, "../build/icon.png");
  const iconPath = fs.existsSync(icoPath) ? icoPath : fs.existsSync(pngPath) ? pngPath : undefined;

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Bard's Library",
    icon: iconPath,
    autoHideMenuBar: true,
    backgroundColor: "#121318",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  win.loadFile(path.join(__dirname, "../dist/index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
