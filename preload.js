const { contextBridge, ipcRenderer } = require('electron');
const helpers = require('./helpers.js');

contextBridge.exposeInMainWorld('helpers', helpers);

contextBridge.exposeInMainWorld('electronAPI', {
    // main -> renderer
    receiveWindows: callback => ipcRenderer.on('update-windows', (event, windows) => callback(windows)),
    receiveSettings: settings => ipcRenderer.on('receive-settings', settings),

    // renderer -> main
    deleteWindow: windowId => ipcRenderer.send('delete-window', windowId),
    saveSettings: settings => ipcRenderer.send('save-settings', settings)
});
