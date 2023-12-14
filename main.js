const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const getActiveWindow = require('active-win');
const windows = {};

const INVALID_WINDOW_PATTERN = /(^https?:\/\/|^[a-z0-9.]+\.com|^TimeTrack$)/;

const windowIdTransforms = {
  'Visual Studio Code': activeWindow => `${activeWindow.owner.name} - ${activeWindow.title.replaceAll('● ', '')}`
};

let win;
let activeWindowId;
let settings;

function createWindow () {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  //win.setMenu(null);
  win.loadFile('index.html');

  setInterval(logActiveWindow, 250);
}

async function logActiveWindow() {
  try {
    const activeWin = await getActiveWindow();
    if (!activeWin) return;

    const { title, owner } = activeWin;
    const { name, path: filePath, processId } = owner;
    const now = Date.now();

    if (INVALID_WINDOW_PATTERN.test(title)) return;

    let id = (windowIdTransforms[name] ? windowIdTransforms[name](activeWin) : `${name} - ${title}`).toLowerCase().replace(/[^\w-]+/g, '-');
    let activeWindow;

    if (!windows[id]) {
      const icon = await app.getFileIcon(filePath);

      windows[id] = { id, title, process: name, processId, filePath, icon: (icon && icon.toDataURL()) || '', startTime: now, activeTime: 0, lastActive: now };
    }

    if (!activeWindow) activeWindow = windows[id];

    if (id === activeWindowId) {
      activeWindow.activeTime += now - activeWindow.lastActive;
    }
    
    activeWindow.lastActive = now;
    activeWindowId = id;

    // Get rid of windows that were active for less than a second
    Object.entries(windows).forEach(([windowId, data]) => {
      if (activeWindowId !== windowId && data.activeTime < 1000) {
        delete windows[windowId];
      }
    });

    win.webContents.send('update-windows', windows);
  } catch (error) {
    console.error('Error fetching active window:', error);
  }
}

ipcMain.on('delete-window', (e, windowId) => {
  delete windows[windowId];
});

ipcMain.on('update-settings', (e, newSettings) => {
  settings = newSettings;
});

app.whenReady().then(createWindow);
