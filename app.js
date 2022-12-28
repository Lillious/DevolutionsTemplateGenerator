const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');
const nconf = require('nconf');
const crash = (err) => { console.error(`\x1b[31m${err}\x1b[0m`); process.exit(1); };
// Check if config file exists
if (!require('fs').existsSync(`${__dirname}/src/www/config.json`)) {
    // Create config file with empty object
    require('fs').writeFileSync(`${__dirname}/src/www/config.json`, '{}');
}

ipcMain.on('save', (event, Accounts, SiteInformation) => {
    nconf.use('file', { file: `${__dirname}/src/www/config.json` });
    nconf.load();
    if (Accounts) {
        nconf.set('Accounts', Accounts);
    }
    if (SiteInformation) {
        nconf.set('Site_Information', SiteInformation);
    }
    nconf.save((err) => {
        if (err) { crash(err); }
    });
});

ipcMain.on('clear', (event) => {
    nconf.use('file', { file: `${__dirname}/src/www/config.json` });
    nconf.load();
    nconf.set('Accounts', {});
    nconf.set('Site_Information', {});
    nconf.save((err) => {
        if (err) { crash(err); }
    });
});

const createWindow = () => {
    const win = new BrowserWindow({
        width: 700,
        minWidth: 700,
        height: 950,
        minHeight: 400,
        frame: false,
        darkTheme: true,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
            sandbox: false,
            spellcheck: false,
        }
    });
    win.loadFile('./src/www/index.html')
    .catch((err) => { crash(err); });
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
})
.catch((err) => { crash(err); });

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('close', () => {
    app.quit();
});

ipcMain.on('minimize', () => {
    BrowserWindow.getAllWindows()[0].minimize();
});

ipcMain.on('maximize', () => {
    if (BrowserWindow.getAllWindows()[0].isMaximized()) {
        BrowserWindow.getAllWindows()[0].unmaximize();
    } else {
        BrowserWindow.getAllWindows()[0].maximize();
    }
});