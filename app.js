const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const ws = require('windows-shortcuts');
const nconf = require('nconf');
const crash = (err) => { console.error(`\x1b[31m${err}\x1b[0m`); process.exit(1); };
// Check if config file exists
if (!require('fs').existsSync(`${__dirname}/src/www/config.json`)) {
    // Create config file with empty object
    require('fs').writeFileSync(`${__dirname}/src/www/config.json`, '{}');
}

if (!fs.existsSync(path.join(__dirname, 'settings.json'))) {
    fs.writeFileSync(path.join(__dirname, 'settings.json'),
        JSON.stringify({
            DesktopShortcutPlaced: false
        }, null, 4));
}

const configFile = fs.readFileSync(path.join(__dirname, 'settings.json'), 'utf8');
const data = JSON.parse(configFile);

if (data.DesktopShortcutPlaced === false) {
    if (fs.existsSync(path.join(os.homedir(), "Desktop", "Devolutions Template Generator.lnk"))) {
        fs.unlinkSync(path.join(os.homedir(), "Desktop", "Devolutions Template Generator.lnk"));
    }
    ws.create(path.join(os.homedir(), "Desktop", "Devolutions Template Generator.lnk"), {
        target: path.join(__dirname, "../../devolutionstemplategenerator.exe"),
        desc: "A Devolutions CSV password template generator designed by Logan Brown",
        icon: path.join(__dirname, "../../resources/app/src/www/img/icon.ico"),
        admin: false,
        workingDir: path.join(__dirname, "../../"),
    }, (err) => {
        if (err) console.log(err);
    });
    data.DesktopShortcutPlaced = true;
}

fs.writeFileSync(path.join(__dirname, 'settings.json'), JSON.stringify(data, null, 4));

ipcMain.on('save', (event, Accounts, SiteInformation) => {
    nconf.use('file', { file: `${__dirname}/src/www/config.json` });
    nconf.load();
    if (Accounts) {
        nconf.set('Accounts', Accounts);
    }
    if (SiteInformation) {
        nconf.set('Site_Information', SiteInformation);
        // Check if date is malformed
        Object.keys(SiteInformation).forEach((key) => {
            if (SiteInformation[key].Engagement_Date) {
                console.log(SiteInformation[key].Engagement_Date);
                // Try to parse date as a new Date object
                const date = new Date(SiteInformation[key].Engagement_Date);
                // Check if date is valid
                if (date.toString() === 'Invalid Date') {
                    // Set date to null
                    SiteInformation[key].Engagement_Date = null;
                }
            }
        });
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
        minHeight: 950,
        frame: false,
        darkTheme: true,
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            contextIsolation: false,
            sandbox: false,
            spellcheck: false,
            ELECTRON_DISABLE_SECURITY_WARNINGS: true,
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

ipcMain.on('restart', () => {
    app.relaunch();
    app.exit();
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