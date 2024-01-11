const { app, BrowserWindow, ipcMain } = require('electron');
const { slug } = require('./helpers.js');
const path = require('path');
const getActiveWindow = require('active-win');
const windows = {};

const INVALID_WINDOW_PATTERN = /(^https?:\/\/|^[a-z0-9.]+\.com|^TimeTrack$)/;

// Regex keys
const windowIdTransforms = {
  'Visual Studio Code': activeWindow => {
    const title = activeWindow.title.replace(/^\s*[^\w]+/i, '');

    activeWindow.title = title;

    return `${activeWindow.owner.name} - ${title}`;
  }
};

//const slug = id => String(id).toLowerCase().replace(/[^\w-]+/g, '-').replace(/\-+/g, '-').replace(/^\-|\-$/g, '');

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

    let { title, owner } = activeWin;
    const { name, path: filePath, processId } = owner;
    const now = Date.now();

    // Window doesn't qualify but we can still process updates
    if (INVALID_WINDOW_PATTERN.test(title)) {
      win.webContents.send('update-windows', windows);
      return;
    }

    const transformKey = windowIdTransforms[name] ? name : Object.keys(windowIdTransforms).find(key => new RegExp(key).test(name));
    const id = slug(transformKey && windowIdTransforms[transformKey] ? windowIdTransforms[transformKey](activeWin) : `${name} - ${title}`);

    // Update in case of changes in the transform
    ({ title } = activeWin);

    if (!windows[id]) {
      const icon = await app.getFileIcon(filePath);

      windows[id] = { id, title, process: name, processId, filePath, icon: (icon && icon.toDataURL()) || '', startTime: now, activeTime: 0, lastActive: now };
    }

    const activeWindow = windows[id];

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
    console.log('Error fetching active window:', error);
  }
}

ipcMain.on('delete-window', (e, windowId) => {
  delete windows[windowId];
});

ipcMain.on('update-settings', (e, newSettings) => {
  settings = newSettings;
});

app.whenReady().then(createWindow);
