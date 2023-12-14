const { contextBridge, ipcRenderer } = require('electron');
const helpers = require('./helpers.js');

contextBridge.exposeInMainWorld('helpers', helpers);

contextBridge.exposeInMainWorld('electronAPI', {
    deleteWindow: windowId => ipcRenderer.send('delete-window', windowId),
    receiveWindows: callback => ipcRenderer.on('update-windows', (event, windows) => callback(windows)),
    updateSettings: settings => ipcRenderer.send('update-settings', settings)
});
