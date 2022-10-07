// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, dialog } = require('electron')
const ipc = require('electron').ipcMain;

ipc.on('close', () => {
  app.quit();
});

ipc.on('minimize', () => {
    BrowserWindow.getFocusedWindow().minimize();
});

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    maxWidth: 800,
    height: 800,
    maxHeight: 800,
    resizable: false,
    maximizable: false,
    show: false,
    center: true,
    opacity: 1,
    frame: false,
    backgroundColor: "#1F1F1F",
    title: "Devolutions Password Template Generator",
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        webSecurity: true
      }
  })

  mainWindow.loadFile('./src/index.html')
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
})
  // Open the DevTools.
  //mainWindow.webContents.openDevTools()
}

// Disable menu bar
// Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})